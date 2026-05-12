import Anthropic from "@anthropic-ai/sdk";
import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";

function makeClient() {
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey =
    process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return createAnthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

export async function POST(req: Request) {
  const provider = makeClient();
  if (!provider) {
    return new Response(
      JSON.stringify({ error: "AI service not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const { messages, toolContext } = await req.json();

    const result = await streamText({
      model: provider("claude-haiku-4-5"),
      system: `You are a knowledgeable AI assistant helping users evaluate ${toolContext?.name ?? "this tool"}.
Tool facts: ${JSON.stringify(toolContext ?? {})}
Be honest, balanced, and specific. If you don't know something, say so. Keep responses under 3 paragraphs.
Never fabricate features or pricing. Direct users to the tool's website for official pricing.`,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[ask-ai]", err);
    return new Response("Error", { status: 500 });
  }
}
