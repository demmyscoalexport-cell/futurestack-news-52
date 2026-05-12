import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

function makeAnthropicClient() {
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

export async function POST(req: NextRequest) {
  const anthropic = makeAnthropicClient();
  if (!anthropic) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  try {
    const { role, goals, budget, currentTools, teamSize } = await req.json();

    const { rows: allTools } = await db.query(
      `SELECT name, slug, tagline, category, has_free, description
       FROM tools WHERE status = 'active' ORDER BY review_count DESC LIMIT 200`,
    );

    const toolsContext = JSON.stringify(allTools, null, 2);

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: `You are the FutureStack AI Stack Advisor. You recommend the optimal combination of AI tools.
Available tools in the FutureStack database:
${toolsContext}
Rules:
- Recommend 4-8 tools maximum
- Explain WHY each tool is chosen for this specific user
- Flag any overlaps between recommended tools
- Suggest a "Quick Win" — one tool they can get value from in the first hour
- Calculate estimated monthly cost
- Rate the stack's synergy (1-10)
- Return a JSON object with the stack recommendation

Response format (JSON only, no markdown):
{
"stack_name": "The [Role] Powerhouse Stack",
"stack_tagline": "catchy 1-liner",
"tools": [
{
"tool_slug": "claude",
"tool_name": "Claude",
"role_in_stack": "Core AI brain",
"why_chosen": "specific reason for this user",
"use_case_in_workflow": "how exactly they'll use it",
"estimated_cost_monthly": 20,
"tier_recommendation": "Pro"
}
],
"total_cost_monthly": 120,
"synergy_score": 8.5,
"synergy_explanation": "These tools pass data to each other via...",
"quick_win_tool": "claude",
"quick_win_action": "Start by using Claude to...",
"stack_warnings": ["Tool X and Y overlap in feature Z"],
"upgrade_path": "When your team grows, add..."
}`,
      messages: [
        {
          role: "user",
          content: `Build me an AI tool stack for:
Role: ${role}
Primary Goals: ${goals?.join(", ")}
Monthly Budget: $${budget}
Current Tools: ${currentTools?.join(", ") || "None"}
Team Size: ${teamSize}`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`,
              ),
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[stack-builder/recommend]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
