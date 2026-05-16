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
    const body = await req.json();

    // Normalise: both the /ai page (old: { message, context })
    // and the ask-ai widget (new: { messages, toolContext }) are supported.
    let messages: { role: "user" | "assistant"; content: string }[];
    let systemPrompt: string;

    if (body.messages) {
      // Widget format
      messages = body.messages;
      const ctx = body.toolContext ?? {};
      systemPrompt = `You are a knowledgeable AI assistant helping users evaluate ${ctx.name ?? "this tool"}.
Tool facts: ${JSON.stringify(ctx)}
Be honest, balanced, and specific. If you don't know something, say so. Keep responses under 3 paragraphs.
Never fabricate features or pricing. Direct users to the tool's website for official pricing.`;
    } else {
      // AI page format: { message: string, context?: string }
      messages = [{ role: "user", content: body.message ?? "" }];
      systemPrompt =
        body.context ??
        `You are DISCOVA AI — the AI assistant for DISCOVA, Africa's digital discovery operating system.
You help African creators, founders, freelancers, and businesses discover tools that work for their realities:
slow internet, Android devices, Naira budgets, Paystack/Flutterwave payments, and startup affordability.
Always consider African context in your recommendations. Be practical and specific.`;
    }

    const result = await streamText({
      model: provider("claude-haiku-4-5"),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[ask-ai]", err);
    return new Response("Error generating response", { status: 500 });
  }
}
