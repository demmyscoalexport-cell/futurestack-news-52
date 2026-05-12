/**
 * Inngest function: generate-daily-articles
 *
 * Runs every day at 8 AM UTC. Pulls trending + new tools from the DB,
 * asks Claude to plan 3 article topics, generates full articles, and
 * publishes them to the site — no external RSS or Perplexity required.
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

interface ArticlePlan {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  angle: string;
  featured_tools: string[];
}

interface GeneratedArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  key_takeaways: string[];
  category: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

const ARTICLE_TYPES = [
  "tool-spotlight",        // deep dive on one trending tool
  "comparison",           // head-to-head of 2-3 tools in same category
  "trends-roundup",       // weekly trend across a category
  "how-to-guide",         // practical guide using specific tools
  "africa-tech-focus",    // Africa-specific tool recommendations
];

const SYSTEM_PROMPT = `You are a senior tech journalist for FutureStack News — a platform for freelancers, agency owners, and SaaS founders in Africa and globally.

Your writing is: sharp, practical, opinionated, and jargon-free. Every sentence earns its place. No fluff.
Your readers want to know: "Should I use this tool today, and will it help my business?"

Africa context: Always consider affordability, mobile-first usage, limited bandwidth, USD pricing vs local income. Highlight free tiers.

Return ONLY valid JSON with these exact keys:
{
  "title": "Article title (max 80 chars)",
  "slug": "url-safe-slug",
  "excerpt": "Compelling 150-200 char summary",
  "content": "Full article in Markdown, 700-1000 words. Use ## headings, bullet lists, bold for key terms. Start with a hook sentence. End with a clear takeaway.",
  "tags": ["tag1", "tag2", "tag3"],
  "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
  "category": "one of: ai-tools | automation | design | marketing | tutorials | industry-trends | africa-tech | comparisons"
}`;

export const generateDailyArticles = inngest.createFunction(
  {
    id: "generate-daily-articles",
    name: "Generate Daily AI News Articles",
    concurrency: { limit: 1 },
    triggers: [
      { cron: "0 8 * * *" }, // Every day at 8am UTC
      { event: "articles/generate.requested" },
    ],
  },
  async ({ step, logger, event }) => {
    const anthropic = makeClient();
    if (!anthropic) {
      logger.error("Anthropic API key not configured — skipping daily article generation");
      return { skipped: true, reason: "no_ai_key" };
    }

    const count: number = (event.data as any)?.count ?? 3;
    logger.info(`Starting daily article generation: ${count} articles`);

    // Step 1: Pull recent + trending tools from the DB to use as context
    const toolContext = await step.run("fetch-tool-context", async () => {
      const [trending, newest, featured] = await Promise.all([
        db.query(
          `SELECT name, slug, tagline, category, pricing_model, tags, africa_friendly
           FROM tools WHERE status = 'active'
           ORDER BY review_count DESC, rating DESC LIMIT 15`,
        ),
        db.query(
          `SELECT name, slug, tagline, category, pricing_model, tags, africa_friendly
           FROM tools WHERE status = 'active' AND is_new = true
           ORDER BY created_at DESC LIMIT 15`,
        ),
        db.query(
          `SELECT name, slug, tagline, category, pricing_model, tags
           FROM tools WHERE status = 'active' AND is_featured = true
           ORDER BY created_at DESC LIMIT 10`,
        ),
      ]);
      return {
        trending: trending.rows,
        newest: newest.rows,
        featured: featured.rows,
      };
    });

    // Step 2: Ask Claude to plan N article topics based on the real tool data
    const articlePlans: ArticlePlan[] = await step.run("plan-articles", async () => {
      const toolSummary = [
        `TRENDING TOOLS: ${toolContext.trending.map((t: any) => `${t.name} (${t.category})`).join(", ")}`,
        `NEWEST TOOLS: ${toolContext.newest.map((t: any) => `${t.name} (${t.category})`).join(", ")}`,
        `FEATURED TOOLS: ${toolContext.featured.map((t: any) => `${t.name} (${t.category})`).join(", ")}`,
      ].join("\n");

      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: `Today is ${today}. Plan exactly ${count} diverse, high-value article topics for FutureStack News readers (freelancers, agency owners, SaaS founders — especially in Africa).

Use the actual tools below as the subject matter. Mix article types across: tool spotlights, comparisons, how-to guides, trend roundups, and Africa-tech angles.

${toolSummary}

Return a JSON array of ${count} objects. Each object must have:
{
  "title": "Compelling article title",
  "slug": "url-slug",
  "excerpt": "150-char teaser",
  "category": "ai-tools|automation|design|marketing|tutorials|industry-trends|africa-tech|comparisons",
  "angle": "One sentence: what specific angle or narrative makes this article interesting",
  "featured_tools": ["Tool1", "Tool2"]
}

Return ONLY the JSON array.`,
        }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "[]";
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) return [];
      try {
        return JSON.parse(match[0]) as ArticlePlan[];
      } catch {
        return [];
      }
    });

    if (articlePlans.length === 0) {
      logger.warn("No article plans generated — aborting");
      return { skipped: true, reason: "no_plans" };
    }

    logger.info(`Planned ${articlePlans.length} articles: ${articlePlans.map((p) => p.title).join(" | ")}`);

    // Step 3: Resolve the AI author ID once
    const authorId = await step.run("resolve-ai-author", async () => {
      const { rows } = await db.query(
        `SELECT id FROM authors WHERE name = 'FutureStack AI' LIMIT 1`,
      );
      if (rows[0]) return rows[0].id as string;
      const { rows: inserted } = await db.query(
        `INSERT INTO authors (name, slug, bio, avatar)
         VALUES ('FutureStack AI', 'futurestack-ai',
           'AI-powered editorial intelligence monitoring the AI tool ecosystem 24/7.',
           '/avatars/ai-author.png')
         ON CONFLICT (slug) DO UPDATE SET bio = EXCLUDED.bio
         RETURNING id`,
      );
      return inserted[0]?.id as string | null;
    });

    // Step 4: Generate + save each article (sequential to stay within rate limits)
    const results: { title: string; status: string; slug?: string; error?: string }[] = [];

    for (let i = 0; i < articlePlans.length; i++) {
      const plan = articlePlans[i];

      const result = await step.run(`generate-article-${i + 1}`, async () => {
        // Generate full article with Claude Sonnet
        const toolDataForPlan = [...toolContext.trending, ...toolContext.newest].filter(
          (t: any) => plan.featured_tools.includes(t.name),
        );

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 3000,
          system: SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: `Write this article for FutureStack News.

Title: ${plan.title}
Angle: ${plan.angle}
Category: ${plan.category}
Featured tools: ${plan.featured_tools.join(", ")}

Tool details:
${toolDataForPlan.map((t: any) =>
  `- ${t.name}: ${t.tagline} | Pricing: ${t.pricing_model} | Africa-friendly: ${t.africa_friendly ?? false}`
).join("\n")}

Write the full article now. Return ONLY valid JSON.`,
          }],
        });

        const text = response.content[0].type === "text" ? response.content[0].text : "{}";
        const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON in response");
        return JSON.parse(jsonMatch[0]) as GeneratedArticle;
      });

      // Step: Generate hero image for this article
      const heroImage = await step.run(`hero-image-${i + 1}`, async () => {
        try {
          const { generateAndUpload } = await import("@/lib/image-gen");
          const res = await generateAndUpload({
            type: "article-hero",
            name: result.title,
            customPrompt: result.title,
          });
          return res.finalUrl;
        } catch {
          return null;
        }
      });

      // Step: Resolve category ID
      const categoryId = await step.run(`resolve-category-${i + 1}`, async () => {
        const slug = result.category || plan.category || "ai-tools";
        const { rows } = await db.query(
          `SELECT id FROM categories WHERE slug = $1 LIMIT 1`, [slug],
        );
        if (rows[0]) return rows[0].id as string;
        const { rows: fb } = await db.query(`SELECT id FROM categories LIMIT 1`);
        return fb[0]?.id as string | null;
      });

      // Step: Save article to DB as published
      const saved = await step.run(`save-article-${i + 1}`, async () => {
        const slug = slugify(result.slug || result.title || plan.slug || `article-${Date.now()}`);
        const content = result.content || "";
        const wordCount = content.split(/\s+/).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200));
        const excerpt = result.excerpt || plan.excerpt || "";

        const { rows } = await db.query(
          `INSERT INTO articles (
             title, slug, excerpt, content, hero_image, cover_image_url,
             author_id, category_id, tags, status, is_featured, is_ai_generated,
             reading_time, word_count, seo_title, seo_description,
             published_at, created_at, updated_at
           ) VALUES (
             $1,$2,$3,$4,$5,$5,$6,$7,$8,'published',false,true,
             $9,$10,$1,$3,NOW(),NOW(),NOW()
           )
           ON CONFLICT (slug) DO UPDATE SET
             title = EXCLUDED.title,
             content = EXCLUDED.content,
             hero_image = EXCLUDED.hero_image,
             updated_at = NOW()
           RETURNING id, slug, status`,
          [
            result.title || plan.title,
            slug,
            excerpt,
            content,
            heroImage,
            authorId,
            categoryId,
            result.tags || [],
            readingTime,
            wordCount,
          ],
        );
        return rows[0] as { id: string; slug: string; status: string } | undefined;
      });

      results.push({
        title: result.title || plan.title,
        status: saved?.status ?? "error",
        slug: saved?.slug,
      });

      logger.info(`Article ${i + 1}/${articlePlans.length} saved: ${saved?.slug}`);
    }

    const published = results.filter((r) => r.status === "published").length;
    logger.info(`Daily article generation complete: ${published}/${results.length} published`);

    return {
      success: true,
      articlesPublished: published,
      articles: results,
    };
  },
);
