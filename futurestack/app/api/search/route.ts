import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock_key_for_build",
});

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q");
    if (!query) return NextResponse.json({ results: [] });

    const supabase = await createClient();

    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Semantic search via Supabase pgvector
    const { data: semanticResults } = await supabase.rpc(
      "search_tools_semantic",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 10,
      },
    );

    // Also run keyword search (ilike logic mapped directly)
    const { data: keywordResults } = await supabase
      .from("tools")
      .select("*, tool_categories(name, slug), tool_scores(futurestack_score)")
      .or(`name.ilike.%${query}%,tagline.ilike.%${query}%`)
      .limit(10);

    // Merge and deduplicate results (semantic results ranked higher)
    const mergedMap = new Map();

    if (semanticResults) {
      semanticResults.forEach((item: any) => {
        mergedMap.set(item.id, { ...item, source: "semantic" });
      });
    }

    if (keywordResults) {
      keywordResults.forEach((item: any) => {
        if (!mergedMap.has(item.id)) {
          mergedMap.set(item.id, { ...item, source: "keyword" });
        }
      });
    }

    const merged = Array.from(mergedMap.values());

    // Also search articles
    const { data: articleResults } = await supabase
      .from("articles")
      .select("id, title, slug, meta_description, hero_image, published_at")
      .or(`title.ilike.%${query}%,meta_description.ilike.%${query}%`)
      .eq("status", "PUBLISHED")
      .limit(5);

    return NextResponse.json({
      tools: merged,
      articles: articleResults || [],
      query,
      total: merged.length + (articleResults?.length ?? 0),
    });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
