import { NextResponse } from "next/server";
import { getDeals } from "@/lib/queries/deals";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);
    const offset = Number(searchParams.get("offset") ?? 0);

    const deals = await getDeals({ type, category, limit, offset });

    return NextResponse.json({ deals });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
