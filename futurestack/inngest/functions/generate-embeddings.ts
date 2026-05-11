import { inngest } from "../client";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock_key_for_build",
});

export const generateEmbeddings = inngest.createFunction(
  {
    id: "generate-embeddings",
    name: "Generate Vector Embeddings",
    triggers: [{ event: "tool/created" }, { event: "article/published" }],
  },
  async ({ event, step }) => {
    const supabase = await createClient();

    if (event.name === "tool/created") {
      const toolId = event.data.toolId;

      const tool = await step.run("fetch-tool", async () => {
        const { data } = await supabase
          .from("tools")
          .select("name, tagline, description, tags")
          .eq("id", toolId)
          .single();
        return data;
      });

      if (tool) {
        const embedding = await step.run(
          "generate-tool-embedding",
          async () => {
            const text = `${tool.name} ${tool.tagline} ${tool.description} ${(tool.tags || []).join(" ")}`;
            const res = await openai.embeddings.create({
              model: "text-embedding-3-small",
              input: text,
            });
            return res.data[0].embedding;
          },
        );

        await step.run("save-tool-embedding", async () => {
          await supabase.from("tools").update({ embedding }).eq("id", toolId);
        });
      }
    }

    if (event.name === "article/published") {
      const articleId = event.data.articleId;

      const article = await step.run("fetch-article", async () => {
        const { data } = await supabase
          .from("articles")
          .select("title, excerpt, content")
          .eq("id", articleId)
          .single();
        return data;
      });

      if (article) {
        const embedding = await step.run(
          "generate-article-embedding",
          async () => {
            const text =
              `${article.title} ${article.excerpt} ${article.content}`.substring(
                0,
                8000,
              ); // limit length
            const res = await openai.embeddings.create({
              model: "text-embedding-3-small",
              input: text,
            });
            return res.data[0].embedding;
          },
        );

        await step.run("save-article-embedding", async () => {
          await supabase
            .from("articles")
            .update({ embedding })
            .eq("id", articleId);
        });
      }
    }

    return { processed: true };
  },
);
