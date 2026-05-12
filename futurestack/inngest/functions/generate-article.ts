import { inngest } from "../client";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

function makeClient() {
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey =
    process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

export const generateArticle = inngest.createFunction(
  {
    id: "generate-article",
    name: "Generate Article with AI",
    concurrency: { limit: 3 },
    triggers: [{ event: "article/approved.for.generation" }],
  },
  async ({ event, step }) => {
    const anthropic = makeClient();
    if (!anthropic) throw new Error("AI service not configured");

    const { signal, relevanceScore } = event.data;

    // Step 1: Generate full article with Claude Sonnet
    const articleContent = await step.run("generate-article-content", async () => {
      const systemPrompt = `You are a senior tech journalist specializing in AI tools.
Your readers are: freelancers, SaaS founders, and agency owners who live inside AI tools every day.
Writing style: Sharp, insightful, opinionated. No fluff. Every sentence earns its place.
Format: Return JSON with exact keys: title, slug, excerpt (150 chars), body (full MDX, 800-1200 words), category, tags, key_takeaways (array)`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Write an article about this news signal.
Signal title: ${signal.title}
Signal summary: ${signal.summary}
Recommended angle: ${relevanceScore.article_angle}
Source URL: ${signal.link || "N/A"}
Write the article now. Return ONLY valid JSON.`,
          },
        ],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      return JSON.parse(clean);
    });

    // Step 2: Generate SEO meta
    const seoMeta = await step.run("generate-seo-meta", async () => {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Generate SEO metadata for this article:
Title: ${articleContent.title}
Excerpt: ${articleContent.excerpt}
Return JSON: {"meta_title": "...", "meta_description": "...", "og_title": "...", "canonical_slug": "..."}`,
          },
        ],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "{}";
      return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
    });

    // Step 3: Generate hero image via shared pipeline (no HTTP self-call)
    const heroImage = await step.run("generate-hero-image", async () => {
      try {
        const { generateAndUpload } = await import("@/lib/image-gen");
        const result = await generateAndUpload({
          type: "article-hero",
          name: articleContent.title,
          customPrompt: articleContent.title,
        });
        return result.finalUrl;
      } catch {
        return null;
      }
    });

    // Step 4: Resolve or create the AI author in pg
    const authorId = await step.run("resolve-author", async () => {
      const { rows } = await db.query(
        `SELECT id FROM authors WHERE slug = 'futurestack-ai' LIMIT 1`,
      );
      if (rows[0]) return rows[0].id;

      const { rows: inserted } = await db.query(
        `INSERT INTO authors (name, slug, bio, avatar)
         VALUES ('FutureStack AI', 'futurestack-ai',
           'AI-powered editorial engine that monitors the AI tool ecosystem 24/7.',
           '/avatars/ai-author.png')
         ON CONFLICT (slug) DO UPDATE SET bio = EXCLUDED.bio
         RETURNING id`,
      );
      return inserted[0]?.id || null;
    });

    // Step 5: Resolve category
    const categoryId = await step.run("resolve-category", async () => {
      const slug = articleContent.category || "ai-tools";
      const { rows } = await db.query(
        `SELECT id FROM categories WHERE slug = $1 LIMIT 1`,
        [slug],
      );
      if (rows[0]) return rows[0].id;
      // Fallback to first available category
      const { rows: fallback } = await db.query(`SELECT id FROM categories LIMIT 1`);
      return fallback[0]?.id || null;
    });

    // Step 6: Save article to pg
    const savedArticle = await step.run("save-article-to-db", async () => {
      const slug = seoMeta.canonical_slug || articleContent.slug;
      const isPublished = (relevanceScore.score ?? 0) >= 9;
      const content = articleContent.body || articleContent.content || "";
      const wordCount = content.split(/\s+/).length;

      const { rows } = await db.query(
        `INSERT INTO articles (
           title, slug, excerpt, content, hero_image, cover_image_url,
           author_id, category_id, tags, status, is_featured, is_ai_generated,
           reading_time, word_count, seo_title, seo_description,
           published_at, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,false,true,$10,$11,$12,$13,$14,NOW(),NOW())
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title, content = EXCLUDED.content, status = EXCLUDED.status,
           hero_image = EXCLUDED.hero_image, updated_at = NOW()
         RETURNING id, slug, status`,
        [
          articleContent.title,
          slug,
          articleContent.excerpt || "",
          content,
          heroImage,
          authorId,
          categoryId,
          articleContent.tags || [],
          isPublished ? "published" : "draft",
          Math.max(1, Math.ceil(wordCount / 200)),
          wordCount,
          seoMeta.meta_title || articleContent.title,
          seoMeta.meta_description || articleContent.excerpt,
          isPublished ? new Date().toISOString() : null,
        ],
      );
      return rows[0];
    });

    // Step 7: If auto-published, trigger notifications
    if (savedArticle?.status === "published") {
      await step.sendEvent("trigger-notifications", {
        name: "article/published",
        data: { articleId: savedArticle.id, article: savedArticle },
      });
    }

    return {
      success: true,
      articleId: savedArticle?.id,
      status: savedArticle?.status,
    };
  },
);
