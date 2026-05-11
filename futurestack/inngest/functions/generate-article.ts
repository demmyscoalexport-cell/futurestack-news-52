import { inngest } from "../client";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import * as fal from "@fal-ai/serverless-client";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const generateArticle = inngest.createFunction(
  {
    id: "generate-article",
    name: "Generate Article with AI",
    concurrency: { limit: 3 },
    triggers: [{ event: "article/approved.for.generation" }],
  },
  async ({ event, step }) => {
    const { signal, relevanceScore } = event.data;

    // Step 1: Generate full article with Claude Sonnet
    const articleContent = await step.run(
      "generate-article-content",
      async () => {
        const systemPrompt = `You are a senior tech journalist specializing in AI tools.
Your readers are: freelancers, SaaS founders, and agency owners who live inside AI tools every day.
Writing style: Sharp, insightful, opinionated. No fluff. Every sentence earns its place.
Format: Return JSON with exact keys: title, slug, excerpt (150 chars), body (full MDX, 800-1200 words), category, tags, key_takeaways (array)`;

        const response = await anthropic.messages.create({
          model: "claude-3-7-sonnet-20250219",
          max_tokens: 3000,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Write an article about this news signal.
Signal title: ${signal.title}
Signal summary: ${signal.summary}
Recommended angle: ${relevanceScore.article_angle}
Source URL: ${signal.link || "N/A"}
Write the article now. Return ONLY valid JSON.`,
            },
          ],
        });

        const text =
          response.content[0].type === "text" ? response.content[0].text : "{}";
        const clean = text.replace(/```json|```/g, "").trim();
        return JSON.parse(clean);
      },
    );

    // Step 2: Generate SEO meta
    const seoMeta = await step.run("generate-seo-meta", async () => {
      const response = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Generate SEO metadata for this article:
Title: ${articleContent.title}
Excerpt: ${articleContent.excerpt}
Return JSON: {"meta_title": "...", "meta_description": "...", "og_title": "...", "canonical_slug": "..."}`,
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "{}";
      return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
    });

    // Step 3: Generate hero image with FAL.ai
    const heroImage = await step.run("generate-hero-image", async () => {
      try {
        const result = (await fal.subscribe("fal-ai/flux/schnell", {
          input: {
            prompt: `Professional tech editorial illustration for article: "${articleContent.title}". Modern, clean, abstract representation of AI technology. Dark mode aesthetic, electric blue accents, geometric patterns. High quality, 16:9 ratio, magazine cover quality.`,
            image_size: "landscape_16_9",
            num_inference_steps: 4,
          },
        })) as any;
        return result?.images?.[0]?.url || null;
      } catch {
        return null;
      }
    });

    // Step 4: Generate social copy variants
    const socialCopy = await step.run("generate-social-copy", async () => {
      const response = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: `Write 3 social media post variants for this article (Twitter/LinkedIn).
Article: ${articleContent.title}
Excerpt: ${articleContent.excerpt}
Return JSON: {"twitter": "...", "linkedin": "...", "thread_hook": "..."}`,
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "{}";
      return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
    });

    // Step 5: Save to Supabase (status: published or draft based on score)
    const savedArticle = await step.run("save-article-to-db", async () => {
      const supabase = await createClient();

      let { data: author } = await supabase
        .from("authors")
        .select("id")
        .eq("slug", "futurestack-ai")
        .single();

      if (!author) {
        const { data: newAuthor } = await supabase
          .from("authors")
          .insert({
            name: "FutureStack AI",
            slug: "futurestack-ai",
            bio: "AI-powered editorial engine that monitors the AI tool ecosystem 24/7.",
            avatar: "/avatars/ai-author.png",
          })
          .select()
          .single();
        author = newAuthor;
      }

      const { data, error } = await supabase
        .from("articles")
        .insert({
          title: articleContent.title,
          slug: seoMeta.canonical_slug || articleContent.slug,
          excerpt: articleContent.excerpt,
          content: articleContent.body,
          featured_image: heroImage,
          author_id: author?.id,
          category: articleContent.category || "ai-news",
          tags: articleContent.tags || [],
          status: relevanceScore.score >= 9 ? "published" : "draft",
          published_at:
            relevanceScore.score >= 9 ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    });

    // Step 6: If auto-published, trigger notifications
    if (savedArticle?.status === "published") {
      await step.sendEvent("trigger-notifications", {
        name: "article/published",
        data: { articleId: savedArticle.id, article: savedArticle },
      });
    }

    return {
      success: true,
      articleId: savedArticle?.id,
      status: savedArticle?.status,
    };
  },
);
