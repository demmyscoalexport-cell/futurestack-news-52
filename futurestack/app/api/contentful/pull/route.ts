import { NextResponse } from "next/server";
import {
  getContentfulNews,
  getContentfulTools,
} from "@/lib/contentful/service";
import { getContentfulContentTypeIds } from "@/lib/contentful/client";

export async function GET() {
  try {
    const contentTypeIds = await getContentfulContentTypeIds();
    const hasToolType = contentTypeIds.includes("tool");
    const hasNewsType = contentTypeIds.includes("newsArticle");

    const [tools, news] = await Promise.all([
      hasToolType
        ? getContentfulTools({ status: "published", limit: 10 })
        : Promise.resolve([]),
      hasNewsType
        ? getContentfulNews({ status: "published", limit: 10 })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      ok: true,
      toolsCount: tools.length,
      newsCount: news.length,
      sampleToolSlugs: tools.slice(0, 3).map((tool) => tool.slug),
      sampleNewsSlugs: news.slice(0, 3).map((article) => article.slug),
      availableContentTypes: contentTypeIds,
      skippedContentTypes: {
        tool: !hasToolType,
        newsArticle: !hasNewsType,
      },
    });
  } catch (error) {
    console.error("[contentful/pull]", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to pull Contentful data",
      },
      { status: 500 },
    );
  }
}
