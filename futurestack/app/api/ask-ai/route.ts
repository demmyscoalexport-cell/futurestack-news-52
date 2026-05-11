import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, toolContext } = await req.json();

    const result = await streamText({
      model: anthropic("claude-3-5-haiku-20241022"),
      system: `You are a knowledgeable AI assistant helping users evaluate ${toolContext.name}.
Tool facts: ${JSON.stringify(toolContext)}
Be honest, balanced, and specific. If you don't know something, say so. Keep responses under 3 paragraphs.
Never fabricate features or pricing. Direct users to the tool's website for official pricing.`,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("Ask AI error:", err);
    return new Response("Error", { status: 500 });
  }
}
