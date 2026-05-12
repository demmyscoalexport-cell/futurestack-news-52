import { inngest } from "../client";
import { db } from "@/lib/db";

// Embeddings require OpenAI — gracefully skip if key not configured
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!OPENAI_API_KEY) return null;
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.substring(0, 8000),
  });
  return res.data[0].embedding;
}

export const generateEmbeddings = inngest.createFunction(
  {
    id: "generate-embeddings",
    name: "Generate Vector Embeddings",
    triggers: [{ event: "tool/created" }, { event: "article/published" }],
  },
  async ({ event, step }) => {
    if (!OPENAI_API_KEY) {
      return { skipped: true, reason: "OPENAI_API_KEY not configured — embeddings disabled" };
    }

    if (event.name === "tool/created") {
      const toolId = event.data.toolId;

      const tool = await step.run("fetch-tool", async () => {
        const { rows } = await db.query(
          `SELECT name, tagline, description, tags FROM tools WHERE id = $1`,
          [toolId],
        );
        return rows[0] || null;
      });

      if (tool) {
        const embedding = await step.run("generate-tool-embedding", async () => {
          const text = `${tool.name} ${tool.tagline} ${tool.description} ${(tool.tags || []).join(" ")}`;
          return generateEmbedding(text);
        });

        if (embedding) {
          await step.run("save-tool-embedding", async () => {
            await db.query(
              `UPDATE tools SET embedding = $1 WHERE id = $2`,
              [JSON.stringify(embedding), toolId],
            );
          });
        }
      }
    }

    if (event.name === "article/published") {
      const articleId = event.data.articleId;

      const article = await step.run("fetch-article", async () => {
        const { rows } = await db.query(
          `SELECT title, excerpt, content FROM articles WHERE id = $1`,
          [articleId],
        );
        return rows[0] || null;
      });

      if (article) {
        const embedding = await step.run("generate-article-embedding", async () => {
          const text = `${article.title} ${article.excerpt} ${article.content}`;
          return generateEmbedding(text);
        });

        if (embedding) {
          await step.run("save-article-embedding", async () => {
            await db.query(
              `UPDATE articles SET embedding = $1 WHERE id = $2`,
              [JSON.stringify(embedding), articleId],
            );
          });
        }
      }
    }

    return { processed: true };
  },
);
