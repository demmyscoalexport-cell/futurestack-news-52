import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOptionalUser } from "@/lib/auth/require-user";

export async function POST(req: NextRequest) {
  try {
    const { toolId, rating, content, userName, location } = await req.json();

    if (!toolId || !rating || !content?.trim()) {
      return NextResponse.json(
        { error: "toolId, rating, and content are required" },
        { status: 400 },
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    const user = await getOptionalUser();

    const displayName =
      userName?.trim() ||
      user?.fullName ||
      user?.email?.split("@")[0] ||
      "Anonymous";

    const result = await db.query(
      `INSERT INTO reviews (tool_id, user_id, user_name, rating, content, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, tool_id, user_name, rating, content, location, upvotes, downvotes, created_at`,
      [
        toolId,
        user?.profileId || null,
        displayName,
        rating,
        content.trim(),
        location?.trim() || null,
      ],
    );

    return NextResponse.json({ review: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/reviews]", err);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 },
    );
  }
}
