import { NextResponse } from "next/server";
import { getOpportunities, countOpportunitiesByType } from "@/lib/queries/opportunities";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);
    const offset = Number(searchParams.get("offset") ?? 0);

    const [opportunities, counts] = await Promise.all([
      getOpportunities({ type, limit, offset }),
      countOpportunitiesByType(),
    ]);

    return NextResponse.json({ opportunities, counts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
