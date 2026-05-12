import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, description, tools } = await req.json();

    if (!name || !Array.isArray(tools) || tools.length === 0) {
      return NextResponse.json({ error: "name and tools are required" }, { status: 400 });
    }

    const slug =
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
      "-" +
      Date.now().toString(36);

    // 1. Insert the stack
    const { rows: stackRows } = await db.query(
      `INSERT INTO stacks (slug, name, description, clone_count, rating, featured, created_at, updated_at)
       VALUES ($1, $2, $3, 0, 0, false, NOW(), NOW())
       RETURNING id, slug`,
      [slug, name, description || null],
    );
    const stack = stackRows[0];
    if (!stack) throw new Error("Failed to create stack");

    // 2. Resolve tool slugs → IDs
    const { rows: dbTools } = await db.query(
      `SELECT id, slug FROM tools WHERE slug = ANY($1)`,
      [tools],
    );

    // 3. Insert stack_tools mapping
    if (dbTools.length > 0) {
      const values = dbTools
        .map((t, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
        .join(", ");
      const params = dbTools.flatMap((t, i) => [stack.id, t.id, i]);
      await db.query(
        `INSERT INTO stack_tools (stack_id, tool_id, position) VALUES ${values}`,
        params,
      );
    }

    return NextResponse.json({
      success: true,
      stackId: stack.id,
      shareableUrl: `/stacks/${stack.slug}`,
    });
  } catch (error) {
    console.error("[stack-builder/save]", error);
    return NextResponse.json({ error: "Failed to save stack" }, { status: 500 });
  }
}
