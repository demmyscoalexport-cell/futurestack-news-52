import { NextResponse } from "next/server";
import { runNewsPipeline } from "@/lib/contentful/pipeline";
import { fetchProviderNews } from "@/lib/contentful/providers";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      items?: Array<Record<string, unknown>>;
      dryRun?: boolean;
      publish?: boolean;
      source?: "manual" | "newsapi" | "tavily";
      query?: string;
      limit?: number;
    };

    const source = body.source ?? "manual";
    const items =
      source === "manual"
        ? (body.items ?? [])
        : await fetchProviderNews({
            provider: source,
            query: body.query,
            limit: body.limit,
          });

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No items available for import from requested source.",
          source,
        },
        { status: 400 },
      );
    }

    const result = await runNewsPipeline({
      items,
      dryRun: body.dryRun ?? true,
      publish: body.publish,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "News publish pipeline failed",
      },
      { status: 500 },
    );
  }
}
