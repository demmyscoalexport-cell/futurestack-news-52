/**
 * Inngest function: generate-tool-spotlight
 *
 * Listens to discova/tool.added and writes a short, punchy "tool spotlight"
 * article (600-900 words) using Claude Haiku for speed.
 *
 * The article is published immediately (status = 'published') so it appears
 * on the news/articles feed alongside the new tool listing.
 */
import { inngest } from "../client";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

function makeClient(): Anthropic | null {
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey =
    process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function estimateReadingTime(text: string): number {
  const wpm = 230;
  const words = text.split(/\s+/).length;
  return Math.max(2, Math.ceil(words / wpm));
}

interface SpotlightArticle {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  meta_description: string;
}

export const generateToolSpotlight = inngest.createFunction(
  {
    id: "generate-tool-spotlight",
    name: "Generate Tool Spotlight Article",
    concurrency: { limit: 3 },
    triggers: [{ event: "discova/tool.added" }],
    // Delay 2 minutes so the tool row is committed before we reference it
    debounce: { period: "2m" },
  },
  async ({ event, step, logger }) => {
    const { slug, name, tagline, description, website, source } = event.data as {
      slug: string;
      name: string;
      tagline: string;
      description: string;
      website: string;
      source: string;
    };

    const anthropic = makeClient();
    if (!anthropic) {
      logger.warn("Anthropic client not configured — skipping spotlight generation");
      return { skipped: true, reason: "no_ai_client" };
    }

    // Step 1: Check if an article for this tool already exists
    const alreadyExists = await step.run("check-existing-article", async () => {
      const candidateSlugs = [
        `${slug}-review`,
        `what-is-${slug}`,
        `${slug}-spotlight`,
        `introducing-${slug}`,
      ];
      const { rows } = await db.query(
        "SELECT slug FROM articles WHERE slug = ANY($1)",
        [candidateSlugs],
      );
      return rows.length > 0;
    });

    if (alreadyExists) {
      logger.info(`Spotlight already exists for ${slug}`);
      return { skipped: true, reason: "article_exists" };
    }

    // Step 2: Generate the spotlight article with Claude
    const article = await step.run("generate-spotlight-content", async () => {
      const systemPrompt = `You are a tech journalist writing for DISCOVA — Africa's digital discovery platform for founders, freelancers, designers, and developers.

Your job: Write a concise, engaging TOOL SPOTLIGHT article that:
- Answers "What is this tool and should I use it?" in under 900 words
- Is practical and actionable (not fluffy marketing copy)
- Highlights any Africa/emerging-market relevance (mobile-friendly? affordable? Mpesa-compatible?)
- Is skimmable: use a short intro, 2-3 sections with bold headers, and a "Bottom Line" conclusion

Return ONLY valid JSON with these exact keys:
{
  "title": "string — punchy headline like 'Meet [Tool]: The [Category] Tool Every [Persona] Needs'",
  "excerpt": "string — 120-150 chars teaser",
  "content": "string — full article in Markdown, 600-900 words",
  "tags": ["array", "of", "5-8", "lowercase", "kebab-case", "tags"],
  "meta_description": "string — 150-160 chars for SEO"
}`;

      const userPrompt = `Write a tool spotlight article for:

Tool name: ${name}
Tagline: ${tagline || "No tagline provided"}
Description: ${description || "No description provided"}
Website: ${website || "N/A"}
Source: ${source === "producthunt" ? "Product Hunt (newly launched)" : source}

Focus on:
1. What problem it solves
2. Who it's best for (be specific)
3. Key features worth knowing
4. Pricing (mention if free or has free tier)
5. Africa relevance — would it work on mobile? Is pricing accessible? Any local alternatives?
6. Bottom line verdict

Keep it sharp and honest. Don't hype, just inform.`;

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
      const clean = raw.replace(/```json|```/g, "").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found in AI response");
      return JSON.parse(match[0]) as SpotlightArticle;
    });

    // Step 3: Insert the article into the DB
    const articleSlug = await step.run("insert-article", async () => {
      // Build a unique slug
      const base = slugify(article.title || `${name} spotlight`);
      let finalSlug = base;
      let attempt = 0;

      while (true) {
        const { rows } = await db.query(
          "SELECT id FROM articles WHERE slug = $1",
          [finalSlug],
        );
        if (rows.length === 0) break;
        attempt++;
        finalSlug = `${base}-${attempt}`;
        if (attempt > 10) {
          finalSlug = `${base}-${Date.now()}`;
          break;
        }
      }

      const wordCount = article.content.split(/\s+/).length;
      const readingTime = estimateReadingTime(article.content);
      const tags = [
        ...(article.tags ?? []),
        "product-hunt",
        "tool-spotlight",
        source,
      ].filter(Boolean);

      await db.query(
        `INSERT INTO articles (
           slug, title, excerpt, content,
           meta_description, seo_title, seo_description,
           status, published_at,
           reading_time, word_count,
           tags, is_ai_generated,
           is_featured, is_breaking,
           created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4,
           $5, $6, $7,
           'published', NOW(),
           $8, $9,
           $10, true,
           false, false,
           NOW(), NOW()
         )`,
        [
          finalSlug,
          article.title,
          article.excerpt,
          article.content,
          article.meta_description,
          article.title,
          article.meta_description,
          readingTime,
          wordCount,
          tags,
        ],
      );

      logger.info(`Published spotlight article: ${finalSlug}`);
      return finalSlug;
    });

    return {
      tool_slug: slug,
      tool_name: name,
      article_slug: articleSlug,
      article_title: article.title,
    };
  },
);
