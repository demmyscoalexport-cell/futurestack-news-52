import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, getOptionalUser } from "@/lib/auth/require-user";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if ("error" in auth) return auth.error;

    const { toolId } = await req.json();

    if (!toolId) {
      return NextResponse.json({ error: "toolId is required" }, { status: 400 });
    }

    const existing = await db.query(
      "SELECT id FROM saved_tools WHERE user_id=$1 AND tool_id=$2",
      [auth.user.profileId, toolId],
    );

    if (existing.rows.length > 0) {
      await db.query(
        "DELETE FROM saved_tools WHERE user_id=$1 AND tool_id=$2",
        [auth.user.profileId, toolId],
      );
      return NextResponse.json({ saved: false });
    }

    await db.query(
      "INSERT INTO saved_tools (user_id, tool_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [auth.user.profileId, toolId],
    );
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update saved tools" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getOptionalUser();
    if (!user) {
      return NextResponse.json({ saved: false });
    }

    const { searchParams } = new URL(req.url);
    const toolId = searchParams.get("toolId");

    if (!toolId) {
      return NextResponse.json({ saved: false });
    }

    const result = await db.query(
      "SELECT id FROM saved_tools WHERE user_id=$1 AND tool_id=$2",
      [user.profileId, toolId],
    );

    return NextResponse.json({ saved: result.rows.length > 0 });
  } catch {
    return NextResponse.json({ saved: false });
  }
}
