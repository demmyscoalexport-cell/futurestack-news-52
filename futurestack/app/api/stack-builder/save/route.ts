import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, tools } = await req.json();

    // 1. Insert Stack
    const { data: stack, error: stackError } = await supabase
      .from("stacks")
      .insert({
        name,
        description,
        creator_id: user.id,
        ai_generated: true,
        is_public: true,
      })
      .select("id, slug")
      .single();

    if (stackError || !stack) {
      throw stackError || new Error("Failed to create stack");
    }

    // 2. Insert to stack_tools mapping
    // tools should be an array of slugs, but we need to map them to tool ids.
    const { data: dbTools } = await supabase
      .from("tools")
      .select("id, slug")
      .in("slug", tools);

    if (dbTools && dbTools.length > 0) {
      const toolInserts = dbTools.map((t, index) => ({
        stack_id: stack.id,
        tool_id: t.id,
        position: index,
      }));

      await supabase.from("stack_tools").insert(toolInserts);
    }

    return NextResponse.json({
      success: true,
      stackId: stack.id,
      shareableUrl: `/stacks/${stack.slug || stack.id}`,
    });
  } catch (error) {
    console.error("Stack builder save API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
