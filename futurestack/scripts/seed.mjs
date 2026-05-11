/**
 * scripts/seed.mjs
 * Runs with plain Node — no TypeScript transpilation needed.
 * Usage: node scripts/seed.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// ── Load .env.local ─────────────────────────────────────────────────────────
try {
  const env = readFileSync(".env.local", "utf-8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim().replace(/\r$/, "");
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  /* rely on shell env */
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const ok = (m) => console.log(`  ✅ ${m}`);
const err = (m, e) =>
  console.error(`  ❌ ${m}`, typeof e === "object" ? (e?.message ?? e) : e);

// ─────────────────────────── DATA ───────────────────────────────────────────

const AUTHORS = [
  {
    name: "Sarah Chen",
    avatar: "/avatars/sarah.png",
    role: "AI Tools Editor",
    bio: "Former PM at Notion. Writing about tools that power modern work.",
  },
  {
    name: "Emeka Okonkwo",
    avatar: "/avatars/emeka.png",
    role: "SaaS Analyst",
    bio: "Building and writing about SaaS from Lagos. Focus on Africa-friendly tools.",
  },
  {
    name: "Alex Rivera",
    avatar: "/avatars/alex.png",
    role: "Automation Expert",
    bio: "Zapier-certified expert helping teams automate boring work since 2019.",
  },
  {
    name: "Maya Patel",
    avatar: "/avatars/maya.png",
    role: "Design Tools Lead",
    bio: "Designer turned writer. Covering AI design tools and creative workflows.",
  },
  {
    name: "FutureStack AI",
    avatar: "/avatars/ai.png",
    role: "AI Writer",
    bio: "AI-generated articles curated by the FutureStack editorial team.",
  },
];

const TOOLS = [
  {
    name: "ChatGPT Pro",
    slug: "chatgpt-pro",
    category: "writing",
    short_description: "AI writing, coding & analysis by OpenAI",
    description:
      "ChatGPT Pro gives you GPT-4o with a 128K context window, DALL-E 3 image generation, and advanced data analysis. The most versatile AI assistant available.",
    website: "https://chat.openai.com",
    has_free: true,
    africa_friendly: true,
    rating: 4.8,
    review_count: 2412,
    featured: true,
    badges: ["free", "pro", "africa-friendly", "trending"],
    platforms: ["Web", "iOS", "Android", "API"],
    integrations: ["Zapier", "Make", "API"],
    best_for: ["Writers", "Developers", "Researchers", "Marketers"],
    pros: ["Best reasoning", "128K context", "Multimodal", "Plugin ecosystem"],
    cons: ["Can hallucinate", "Rate limits on free tier", "Expensive at scale"],
    subcategories: ["coding", "analysis", "research"],
    scores: {
      ease_of_use: 9.0,
      value_for_money: 8.0,
      feature_depth: 9.5,
      support_quality: 7.0,
      integration_richness: 9.0,
      ai_capability: 9.5,
    },
    pricing: [
      {
        tier_name: "Free",
        price_monthly: 0,
        is_free_tier: true,
        features: ["GPT-4o mini", "Limited GPT-4o", "Basic tools"],
      },
      {
        tier_name: "Plus",
        price_monthly: 20,
        is_popular: true,
        features: ["GPT-4o", "DALL-E 3", "Advanced analysis"],
      },
      {
        tier_name: "Team",
        price_monthly: 25,
        features: ["Everything in Plus", "Admin console", "SSO"],
      },
    ],
  },
  {
    name: "Claude",
    slug: "claude",
    category: "writing",
    short_description: "Thoughtful AI for complex analysis and long writing",
    description:
      "Claude by Anthropic excels at nuanced long-form writing, code review, and complex reasoning. Its 200K context window handles entire codebases.",
    website: "https://claude.ai",
    has_free: true,
    africa_friendly: true,
    rating: 4.7,
    review_count: 1543,
    featured: true,
    badges: ["free", "pro", "africa-friendly", "editor-pick"],
    platforms: ["Web", "iOS", "API"],
    integrations: ["API", "Slack", "Cursor"],
    best_for: ["Researchers", "Analysts", "Developers", "Writers"],
    pros: [
      "200K context window",
      "Strong ethics",
      "Nuanced writing",
      "Great at code",
    ],
    cons: ["Slower than GPT-4", "More cautious", "Fewer integrations"],
    subcategories: ["analysis", "coding", "research"],
    scores: {
      ease_of_use: 8.5,
      value_for_money: 8.5,
      feature_depth: 9.0,
      support_quality: 7.5,
      integration_richness: 7.5,
      ai_capability: 9.0,
    },
    pricing: [
      {
        tier_name: "Free",
        price_monthly: 0,
        is_free_tier: true,
        features: ["Claude 3.5 Haiku", "Limited usage"],
      },
      {
        tier_name: "Pro",
        price_monthly: 20,
        is_popular: true,
        features: ["5x usage", "Claude Sonnet & Opus", "Priority access"],
      },
      {
        tier_name: "Team",
        price_monthly: 25,
        features: ["Everything in Pro", "Admin tools", "Central billing"],
      },
    ],
  },
  {
    name: "Midjourney",
    slug: "midjourney",
    category: "design",
    short_description: "AI image generation with top artistic quality",
    description:
      "Midjourney creates stunning photorealistic and artistic images from text prompts. The gold standard for AI image generation, used by top creative studios.",
    website: "https://midjourney.com",
    has_free: false,
    africa_friendly: false,
    rating: 4.9,
    review_count: 1834,
    featured: true,
    badges: ["pro", "trending", "editor-pick"],
    platforms: ["Discord", "Web"],
    integrations: ["Discord"],
    best_for: ["Designers", "Artists", "Marketing teams", "Content creators"],
    pros: [
      "Best-in-class quality",
      "Strong artistic style",
      "Active community",
    ],
    cons: ["No free tier", "Discord interface", "Learning curve"],
    subcategories: ["image-generation", "art", "creative"],
    scores: {
      ease_of_use: 7.0,
      value_for_money: 8.0,
      feature_depth: 8.5,
      support_quality: 6.5,
      integration_richness: 5.0,
      ai_capability: 9.5,
    },
    pricing: [
      {
        tier_name: "Basic",
        price_monthly: 10,
        features: ["200 images/month", "Commercial license"],
      },
      {
        tier_name: "Standard",
        price_monthly: 30,
        is_popular: true,
        features: ["15h fast GPU", "Unlimited relaxed"],
      },
      {
        tier_name: "Pro",
        price_monthly: 60,
        features: ["30h fast GPU", "Stealth mode"],
      },
    ],
  },
  {
    name: "GitHub Copilot",
    slug: "github-copilot",
    category: "code",
    short_description: "AI pair programmer integrated into your IDE",
    description:
      "GitHub Copilot writes code, explains bugs, and generates tests inside VS Code, JetBrains, and Neovim. The most widely adopted AI coding tool.",
    website: "https://github.com/features/copilot",
    has_free: true,
    africa_friendly: true,
    rating: 4.7,
    review_count: 3201,
    featured: true,
    badges: ["free", "pro", "trending"],
    platforms: ["VS Code", "JetBrains", "Neovim", "CLI"],
    integrations: ["GitHub", "GitLab", "Bitbucket"],
    best_for: ["Developers", "DevOps", "Students", "Open-source contributors"],
    pros: ["IDE-native", "Context-aware", "Multi-language", "Fast completions"],
    cons: ["Privacy concerns", "Code quality varies", "Needs good prompts"],
    subcategories: ["code-completion", "debugging", "testing"],
    scores: {
      ease_of_use: 9.0,
      value_for_money: 8.5,
      feature_depth: 8.5,
      support_quality: 8.0,
      integration_richness: 9.0,
      ai_capability: 8.5,
    },
    pricing: [
      {
        tier_name: "Free",
        price_monthly: 0,
        is_free_tier: true,
        features: ["2000 completions/month", "50 chat messages"],
      },
      {
        tier_name: "Pro",
        price_monthly: 10,
        is_popular: true,
        features: ["Unlimited completions", "All models", "CLI access"],
      },
      {
        tier_name: "Business",
        price_monthly: 19,
        features: ["Everything in Pro", "Policy management", "Audit logs"],
      },
    ],
  },
  {
    name: "Cursor",
    slug: "cursor",
    category: "code",
    short_description: "AI-first code editor built on VS Code",
    description:
      "Cursor is a fork of VS Code that deeply integrates Claude and GPT-4 for chat, edit, and code generation. It understands your entire codebase context.",
    website: "https://cursor.sh",
    has_free: true,
    africa_friendly: true,
    rating: 4.8,
    review_count: 876,
    featured: true,
    badges: ["free", "pro", "trending", "new"],
    platforms: ["Mac", "Windows", "Linux"],
    integrations: ["GitHub", "Claude", "GPT-4"],
    best_for: ["Full-stack developers", "Solo founders", "AI engineers"],
    pros: [
      "Codebase awareness",
      "Multi-file edits",
      "VS Code compatible",
      "Fast",
    ],
    cons: [
      "$20/month for best models",
      "Occasional hallucinations",
      "Heavy on RAM",
    ],
    subcategories: ["code-editor", "ai-chat", "refactoring"],
    scores: {
      ease_of_use: 8.5,
      value_for_money: 9.0,
      feature_depth: 9.0,
      support_quality: 7.5,
      integration_richness: 8.0,
      ai_capability: 9.0,
    },
    pricing: [
      {
        tier_name: "Hobby",
        price_monthly: 0,
        is_free_tier: true,
        features: ["2000 completions", "50 slow requests"],
      },
      {
        tier_name: "Pro",
        price_monthly: 20,
        is_popular: true,
        features: ["Unlimited completions", "500 fast requests", "All models"],
      },
      {
        tier_name: "Business",
        price_monthly: 40,
        features: ["Privacy mode", "Admin panel", "SSO"],
      },
    ],
  },
  {
    name: "Zapier",
    slug: "zapier",
    category: "automation",
    short_description: "No-code automation connecting 7000+ apps",
    description:
      "Zapier connects your apps and automates workflows without code. Build multi-step automations (Zaps) across 7000+ apps with an AI-powered workflow builder.",
    website: "https://zapier.com",
    has_free: true,
    africa_friendly: true,
    rating: 4.6,
    review_count: 3421,
    featured: false,
    badges: ["free", "pro", "no-code", "africa-friendly"],
    platforms: ["Web"],
    integrations: ["7000+ apps"],
    best_for: [
      "Freelancers",
      "Marketers",
      "Operations teams",
      "Small businesses",
    ],
    pros: [
      "Biggest app library",
      "No-code",
      "Reliable uptime",
      "AI Zap builder",
    ],
    cons: [
      "Expensive at scale",
      "Task limits per tier",
      "Complex flows are hard",
    ],
    subcategories: ["integration", "workflow", "no-code"],
    scores: {
      ease_of_use: 9.0,
      value_for_money: 7.0,
      feature_depth: 8.5,
      support_quality: 8.5,
      integration_richness: 10.0,
      ai_capability: 7.0,
    },
    pricing: [
      {
        tier_name: "Free",
        price_monthly: 0,
        is_free_tier: true,
        features: ["100 tasks/month", "5 Zaps"],
      },
      {
        tier_name: "Starter",
        price_monthly: 19.99,
        is_popular: true,
        features: ["750 tasks/month", "20 Zaps", "Multi-step"],
      },
      {
        tier_name: "Professional",
        price_monthly: 49,
        features: ["2000 tasks", "Unlimited Zaps", "Paths"],
      },
    ],
  },
  {
    name: "Canva",
    slug: "canva",
    category: "design",
    short_description: "AI-enhanced design platform for everyone",
    description:
      "Canva makes professional design accessible with 250K+ templates, AI image generation, Magic Write, background remover, and Brand Kit for teams.",
    website: "https://canva.com",
    has_free: true,
    africa_friendly: true,
    rating: 4.8,
    review_count: 5678,
    featured: false,
    badges: ["free", "pro", "africa-friendly", "no-code"],
    platforms: ["Web", "Desktop", "iOS", "Android"],
    integrations: ["Google Drive", "Dropbox", "Social platforms"],
    best_for: ["Non-designers", "Social media managers", "SMBs", "Students"],
    pros: [
      "Huge template library",
      "Easy to use",
      "Great free tier",
      "AI image gen",
    ],
    cons: ["Limited for complex design", "Watermarks on some free assets"],
    subcategories: ["graphics", "presentation", "social-media"],
    scores: {
      ease_of_use: 9.5,
      value_for_money: 9.0,
      feature_depth: 7.5,
      support_quality: 8.0,
      integration_richness: 8.0,
      ai_capability: 7.5,
    },
    pricing: [
      {
        tier_name: "Free",
        price_monthly: 0,
        is_free_tier: true,
        features: ["250K templates", "5GB storage", "Basic AI"],
      },
      {
        tier_name: "Pro",
        price_monthly: 12.99,
        is_popular: true,
        features: ["All templates", "Brand Kit", "1TB storage", "Magic AI"],
      },
      {
        tier_name: "Teams",
        price_monthly: 14.99,
        features: ["Everything in Pro", "Team folders", "Admin controls"],
      },
    ],
  },
  {
    name: "ElevenLabs",
    slug: "elevenlabs",
    category: "audio",
    short_description: "Ultra-realistic AI voice generation and cloning",
    description:
      "ElevenLabs generates the most realistic AI voices available. Clone your voice, create podcasts, dub videos in 29 languages, and build voice apps via API.",
    website: "https://elevenlabs.io",
    has_free: true,
    africa_friendly: true,
    rating: 4.8,
    review_count: 1102,
    featured: false,
    badges: ["free", "pro", "trending", "new"],
    platforms: ["Web", "API"],
    integrations: ["API", "Zapier", "Notion"],
    best_for: ["Content creators", "Podcasters", "Developers", "Publishers"],
    pros: [
      "Most realistic voices",
      "Voice cloning",
      "Multilingual",
      "Fast API",
    ],
    cons: ["Free tier limited", "Cloning needs consent", "Expensive at scale"],
    subcategories: ["text-to-speech", "voice-cloning", "dubbing"],
    scores: {
      ease_of_use: 8.5,
      value_for_money: 8.0,
      feature_depth: 9.0,
      support_quality: 7.5,
      integration_richness: 8.0,
      ai_capability: 9.5,
    },
    pricing: [
      {
        tier_name: "Free",
        price_monthly: 0,
        is_free_tier: true,
        features: ["10K chars/month", "3 custom voices"],
      },
      {
        tier_name: "Starter",
        price_monthly: 5,
        features: ["30K chars/month", "10 custom voices"],
      },
      {
        tier_name: "Creator",
        price_monthly: 22,
        is_popular: true,
        features: ["100K chars/month", "30 voices", "Commercial license"],
      },
    ],
  },
  {
    name: "Runway ML",
    slug: "runway-ml",
    category: "video",
    short_description: "AI video generation and creative editing platform",
    description:
      "Runway leads AI video generation with Gen-3, motion brush, and inpainting tools. Used by Hollywood studios and indie creators for next-gen video production.",
    website: "https://runwayml.com",
    has_free: true,
    africa_friendly: true,
    rating: 4.7,
    review_count: 678,
    featured: false,
    badges: ["free", "pro", "trending"],
    platforms: ["Web", "iOS"],
    integrations: ["After Effects", "Premiere Pro"],
    best_for: ["Video editors", "Content creators", "Filmmakers", "Marketers"],
    pros: ["Industry-leading video AI", "Easy to use", "Regular model updates"],
    cons: ["Credit-based pricing", "Render times vary", "Quality inconsistent"],
    subcategories: ["video-generation", "editing", "vfx"],
    scores: {
      ease_of_use: 7.5,
      value_for_money: 7.0,
      feature_depth: 9.0,
      support_quality: 7.0,
      integration_richness: 6.5,
      ai_capability: 9.5,
    },
    pricing: [
      {
        tier_name: "Free",
        price_monthly: 0,
        is_free_tier: true,
        features: ["125 one-time credits"],
      },
      {
        tier_name: "Standard",
        price_monthly: 15,
        features: ["625 credits/month", "Gen-3 video"],
      },
      {
        tier_name: "Pro",
        price_monthly: 35,
        is_popular: true,
        features: ["2250 credits/month", "Priority rendering", "4K export"],
      },
    ],
  },
  {
    name: "Notion AI",
    slug: "notion-ai",
    category: "productivity",
    short_description: "AI assistant built inside your Notion workspace",
    description:
      "Notion AI lets you write, summarize, translate, and brainstorm directly in your workspace — no context-switching required. Works across all Notion plans.",
    website: "https://notion.so/ai",
    has_free: false,
    africa_friendly: true,
    rating: 4.5,
    review_count: 1256,
    featured: false,
    badges: ["pro", "africa-friendly"],
    platforms: ["Web", "Desktop", "iOS", "Android"],
    integrations: ["Slack", "Google Drive", "Figma", "GitHub"],
    best_for: ["Teams", "Project managers", "Writers", "Students"],
    pros: [
      "Zero context-switching",
      "Team collaboration",
      "Great UX",
      "Template library",
    ],
    cons: ["Requires Notion plan", "Limited vs standalone AI", "Can be slow"],
    subcategories: ["writing", "organization", "project-management"],
    scores: {
      ease_of_use: 9.0,
      value_for_money: 7.5,
      feature_depth: 7.0,
      support_quality: 8.0,
      integration_richness: 8.5,
      ai_capability: 7.5,
    },
    pricing: [
      {
        tier_name: "AI Add-on",
        price_monthly: 10,
        is_popular: true,
        features: ["Unlimited AI responses", "All Notion plans supported"],
      },
    ],
  },
  {
    name: "Perplexity AI",
    slug: "perplexity-ai",
    category: "data",
    short_description: "AI answer engine with real-time web search",
    description:
      "Perplexity combines LLMs with real-time web search, giving cited answers to complex questions. The best AI for research, fact-checking, and market analysis.",
    website: "https://perplexity.ai",
    has_free: true,
    africa_friendly: true,
    rating: 4.6,
    review_count: 892,
    featured: false,
    badges: ["free", "pro", "trending"],
    platforms: ["Web", "iOS", "Android", "API"],
    integrations: ["API"],
    best_for: ["Researchers", "Journalists", "Students", "Analysts"],
    pros: ["Real-time web data", "Source citations", "Fast", "Great free tier"],
    cons: [
      "Less creative than ChatGPT",
      "API is expensive",
      "Occasional hallucinations",
    ],
    subcategories: ["research", "search", "analysis"],
    scores: {
      ease_of_use: 9.0,
      value_for_money: 8.5,
      feature_depth: 7.5,
      support_quality: 7.0,
      integration_richness: 6.0,
      ai_capability: 8.5,
    },
    pricing: [
      {
        tier_name: "Free",
        price_monthly: 0,
        is_free_tier: true,
        features: ["Unlimited basic searches", "5 Pro searches/day"],
      },
      {
        tier_name: "Pro",
        price_monthly: 20,
        is_popular: true,
        features: ["Unlimited Pro searches", "File uploads", "API access"],
      },
    ],
  },
  {
    name: "Make",
    slug: "make",
    category: "automation",
    short_description: "Visual workflow automation with 1500+ connectors",
    description:
      "Make (formerly Integromat) offers a visual drag-and-drop workflow builder with complex logic, data transformation, and 1500+ integrations at half the cost of Zapier.",
    website: "https://make.com",
    has_free: true,
    africa_friendly: true,
    rating: 4.5,
    review_count: 1876,
    featured: false,
    badges: ["free", "pro", "no-code"],
    platforms: ["Web"],
    integrations: ["1500+ apps"],
    best_for: ["Agencies", "Power users", "Developers", "Operations teams"],
    pros: [
      "Visual builder",
      "Complex logic support",
      "Cheaper than Zapier",
      "1500+ connectors",
    ],
    cons: [
      "Steeper learning curve",
      "Slower support",
      "UI can be overwhelming",
    ],
    subcategories: ["integration", "workflow", "automation"],
    scores: {
      ease_of_use: 7.5,
      value_for_money: 9.0,
      feature_depth: 9.0,
      support_quality: 7.0,
      integration_richness: 9.0,
      ai_capability: 6.5,
    },
    pricing: [
      {
        tier_name: "Free",
        price_monthly: 0,
        is_free_tier: true,
        features: ["1000 ops/month", "2 active scenarios"],
      },
      {
        tier_name: "Core",
        price_monthly: 9,
        is_popular: true,
        features: ["10K ops/month", "Unlimited scenarios"],
      },
      {
        tier_name: "Pro",
        price_monthly: 16,
        features: ["10K ops/month", "Custom variables", "Priority execution"],
      },
    ],
  },
  {
    name: "v0 by Vercel",
    slug: "v0-vercel",
    category: "code",
    short_description: "AI UI generator that outputs production React code",
    description:
      "v0 generates production-ready React components from text prompts or screenshots. Outputs clean Tailwind CSS and shadcn/ui components you can deploy in one click.",
    website: "https://v0.dev",
    has_free: true,
    africa_friendly: true,
    rating: 4.7,
    review_count: 412,
    featured: true,
    badges: ["free", "pro", "new", "trending"],
    platforms: ["Web"],
    integrations: ["Vercel", "Next.js", "shadcn/ui"],
    best_for: ["Frontend developers", "SaaS founders", "Designers who code"],
    pros: [
      "Production-ready code",
      "shadcn/ui output",
      "Iterate fast",
      "Generous free tier",
    ],
    cons: [
      "Complex layouts need tweaking",
      "Next.js/React only",
      "Still maturing",
    ],
    subcategories: ["ui-generation", "react", "tailwind"],
    scores: {
      ease_of_use: 9.0,
      value_for_money: 9.5,
      feature_depth: 8.0,
      support_quality: 7.5,
      integration_richness: 7.5,
      ai_capability: 8.5,
    },
    pricing: [
      {
        tier_name: "Free",
        price_monthly: 0,
        is_free_tier: true,
        features: ["200 credits/month", "Unlimited preview"],
      },
      {
        tier_name: "Premium",
        price_monthly: 20,
        is_popular: true,
        features: ["5000 credits/month", "Priority generation"],
      },
    ],
  },
  {
    name: "Jasper AI",
    slug: "jasper-ai",
    category: "marketing",
    short_description: "AI copywriting for marketing teams",
    description:
      "Jasper is purpose-built for marketing — brand voice training, 50+ output templates, and integrations with Surfer SEO and Grammarly for content-led growth.",
    website: "https://jasper.ai",
    has_free: false,
    africa_friendly: false,
    rating: 4.4,
    review_count: 892,
    featured: false,
    badges: ["pro", "trending"],
    platforms: ["Web", "Chrome extension"],
    integrations: ["Surfer SEO", "Grammarly", "HubSpot"],
    best_for: ["Marketing teams", "Content agencies", "E-commerce brands"],
    pros: [
      "Brand voice AI",
      "50+ templates",
      "SEO integration",
      "Team workflows",
    ],
    cons: ["Expensive", "Overkill for individuals", "Generic without training"],
    subcategories: ["copywriting", "content", "seo"],
    scores: {
      ease_of_use: 8.0,
      value_for_money: 6.5,
      feature_depth: 8.5,
      support_quality: 8.0,
      integration_richness: 7.5,
      ai_capability: 7.5,
    },
    pricing: [
      {
        tier_name: "Creator",
        price_monthly: 49,
        features: ["Unlimited words", "50+ templates", "Brand voice"],
      },
      {
        tier_name: "Pro",
        price_monthly: 69,
        is_popular: true,
        features: ["3 brand voices", "10 knowledge assets", "SEO mode"],
      },
    ],
  },
  {
    name: "Surfer SEO",
    slug: "surfer-seo",
    category: "marketing",
    short_description: "AI-powered SEO content optimization",
    description:
      "Surfer SEO analyzes top-ranking pages and gives real-time content scores as you write. Integrates with Jasper, Google Docs, and WordPress for full SEO workflows.",
    website: "https://surferseo.com",
    has_free: false,
    africa_friendly: false,
    rating: 4.5,
    review_count: 654,
    featured: false,
    badges: ["pro"],
    platforms: ["Web", "Chrome extension"],
    integrations: ["Jasper", "Google Docs", "WordPress"],
    best_for: ["SEO writers", "Content marketers", "Agencies", "Bloggers"],
    pros: [
      "Real-time content score",
      "NLP keyword analysis",
      "SERP analyzer",
      "Audit tool",
    ],
    cons: ["No free tier", "Learning curve", "Data can be stale"],
    subcategories: ["seo", "content-optimization", "keyword-research"],
    scores: {
      ease_of_use: 7.5,
      value_for_money: 7.5,
      feature_depth: 9.0,
      support_quality: 7.5,
      integration_richness: 8.0,
      ai_capability: 7.5,
    },
    pricing: [
      {
        tier_name: "Essential",
        price_monthly: 89,
        features: ["30 articles/month", "5 team members"],
      },
      {
        tier_name: "Scale",
        price_monthly: 129,
        is_popular: true,
        features: ["100 articles/month", "15 team members", "API"],
      },
    ],
  },
];

const ARTICLES = [
  {
    slug: "10-ai-writing-tools-2026",
    featured: true,
    read_time: 12,
    title: "10 AI Writing Tools That Actually Save Time in 2026",
    excerpt:
      "A practical guide to the AI writing tools professionals are using right now — with honest pros, cons, and pricing breakdowns.",
    category: "ai-tools",
    tags: ["writing", "productivity", "content-creation"],
    target_roles: ["freelancer", "agency", "saas-founder"],
    author_name: "Sarah Chen",
    content: `The AI writing landscape has matured. Today's best tools produce work that's genuinely useful.

## The Benchmark

A tool earns its place by cutting a real task from hours to minutes. We tested 24 tools across three months. Here are the 10 that made the cut.

## 1. Claude (Anthropic)

Claude's 200K context window makes it the only tool that can hold your entire strategic document, brand guidelines, and current draft in one conversation.

> **Best for:** Long-form content, document analysis, structured writing tasks.

## 2. ChatGPT Pro

Still the most capable general-purpose tool. GPT-4o handles everything from ad copy to Python scripts. The breadth of the plugin ecosystem makes it the Swiss Army knife of AI.

## 3. Jasper AI

Where ChatGPT is a generalist, Jasper is purpose-built for marketing. Brand voice training — where you feed it your existing content and it learns your style — is genuinely impressive.

At $49/month for the Creator plan, the time saved pays for itself in week one for a content team.

## The Bottom Line

For solo freelancers: **Claude Pro** ($20/month) handles 90% of writing tasks with the longest memory.

For marketing teams: **Jasper + Surfer SEO** is the stack powering the most efficient content operations in 2026.

For SaaS founders: **ChatGPT Pro** with a custom GPT trained on your docs is fastest for consistent product copy.`,
  },
  {
    slug: "cursor-vs-copilot-2026",
    featured: true,
    read_time: 10,
    title: "Cursor vs GitHub Copilot: Which AI Coding Tool Wins in 2026?",
    excerpt:
      "We used both tools on real production codebases for 8 weeks. Here is what we found.",
    category: "comparisons",
    tags: ["coding", "developer-tools", "comparison"],
    target_roles: ["saas-founder", "freelancer"],
    author_name: "Alex Rivera",
    content: `Two years ago, GitHub Copilot had no real competition. Today, Cursor has changed what developers expect from AI coding tools.

## What Cursor Does Differently

Cursor is built around **codebase awareness**. While Copilot suggests completions line-by-line, Cursor understands your entire project structure.

Ask Cursor to "add rate limiting to all API routes" and it will find every route file, understand your middleware pattern, and apply consistent changes across all of them.

> **Key insight:** Copilot makes you faster at writing code. Cursor makes you capable of code you couldn't write alone.

## Where GitHub Copilot Wins

**Reliability.** Copilot's completions are fast and consistent. **IDE integration** — Copilot works identically across VS Code, JetBrains, Neovim, and Xcode. Cursor is VS Code only.

## Verdict

| Need | Use |
|---|---|
| Fast, reliable completions | Copilot |
| Complex multi-file refactors | Cursor |
| Enterprise team | Copilot Business |
| Solo SaaS developer | Cursor Pro |
| Free option | Copilot Free |

**Our recommendation:** Use Cursor Pro as primary, with Copilot as a fallback for fast inline completions.`,
  },
  {
    slug: "automate-client-onboarding-2026",
    featured: false,
    read_time: 15,
    title: "How to Automate Client Onboarding with Make and AI",
    excerpt:
      "Save 5+ hours per week by automating client onboarding. Complete walkthrough with a ready-to-copy Make scenario.",
    category: "tutorials",
    tags: ["automation", "make", "agency", "workflow"],
    target_roles: ["freelancer", "agency"],
    author_name: "Alex Rivera",
    content: `Client onboarding is one of the highest-leverage processes to automate. It is repetitive, document-heavy, and easy to get wrong when you are busy.

## What We Are Building

- **Trigger:** New client status = "Signed" in your CRM
- **Step 1:** Create a Notion workspace from template
- **Step 2:** Generate a personalized welcome email with Claude
- **Step 3:** Send email via Resend
- **Step 4:** Add client to Slack with a welcome message

**Time to set up:** ~3 hours. **Time saved weekly:** 5–8 hours.

## The Make Scenario

\`\`\`
Watch CRM [Trigger]
  → Get Client Data
    → Claude: Generate Welcome Email
      → Send Email (Resend)
        → Create Notion Page
          → Invite to Slack
\`\`\`

## AI Email Generation

Add an HTTP module pointing to the Claude API:

\`\`\`json
{
  "model": "claude-haiku-4-5",
  "messages": [{
    "role": "user",
    "content": "Write a warm welcome email for {{client_name}} hired for {{project_type}}. Under 150 words."
  }]
}
\`\`\`

## The Cost

Make Core ($9/month) + Claude Pro ($20/month) = **$29/month total** to replace 5+ hours of manual work per week.`,
  },
  {
    slug: "saas-founder-ai-stack-2026",
    featured: true,
    read_time: 9,
    title: "The Lean SaaS Founder AI Stack for 2026",
    excerpt:
      "Ship your MVP faster with this battle-tested combination of AI tools. No fluff — just what actually works.",
    category: "industry-trends",
    tags: ["saas", "founders", "stack", "tools"],
    target_roles: ["saas-founder"],
    author_name: "Emeka Okonkwo",
    content: `Solo SaaS founders have never had this much leverage. The right AI stack lets one person build, ship, market, and support a product that would have required a team of 5 in 2020.

## The Core Stack ($100/month)

| Role | Tool | Cost |
|---|---|---|
| Building | Cursor Pro | $20/month |
| Thinking | Claude Pro | $20/month |
| Design | v0 by Vercel | $20/month |
| Automation | Zapier Starter | $20/month |
| Writing | ChatGPT Plus | $20/month |

## How Each Tool Earns Its Slot

**Cursor Pro** handles all coding. Multi-file edit means you describe architectural changes in plain English and let Cursor implement them across your codebase.

**Claude Pro** is your thinking partner. Feed it your PRD, user interviews, and competitor analysis. It synthesizes better than a junior PM and works at 3am.

**v0 by Vercel** generates UI components. Describe a page, get production-ready React with Tailwind. Iterate 10x faster than designing in Figma first.

> **The honest truth:** This stack works if you also work. AI tools amplify effort — they do not replace it.`,
  },
  {
    slug: "elevenlabs-voice-ai-guide",
    featured: false,
    read_time: 8,
    title: "ElevenLabs in 2026: The Complete Guide for Content Creators",
    excerpt:
      "ElevenLabs now powers podcasts, YouTube channels, and audiobooks at a fraction of traditional costs.",
    category: "ai-tools",
    tags: ["audio", "voice", "content-creation", "elevenlabs"],
    target_roles: ["freelancer", "agency"],
    author_name: "Maya Patel",
    content: `Voice content has exploded. ElevenLabs is the engine behind much of it.

## What ElevenLabs Does Best

**Voice cloning** is the flagship feature. Record 30 minutes of clean audio and ElevenLabs learns your voice. The clone handles any script in any tone.

Practical use cases:
- Narrate YouTube videos without recording sessions
- Create podcast ads in your voice
- Produce audiobook versions of written content
- Build voice interfaces for apps

## Sound Quality in 2026

Genuinely hard to distinguish from real voice in most cases. The uncanny valley effect that plagued early voice AI is mostly gone at the Creator tier.

Where it still struggles: highly emotional content, accents outside the top 10 languages, very fast speaking speeds.

## The Africa-Friendly Verdict

ElevenLabs accepts international cards. The Creator plan at $22/month is steep but achievable for a freelancer with one retainer client.

> **Pro tip:** 10K characters (free tier) equals ~8 minutes of narration — enough to produce a real sample for a client pitch.`,
  },
  {
    slug: "midjourney-v7-review",
    featured: false,
    read_time: 7,
    title: "Midjourney V7: What Changed and Is It Worth the Upgrade?",
    excerpt:
      "Midjourney V7 brings draft mode, personalization, and native image editing. Our assessment after 30 days.",
    category: "ai-tools",
    tags: ["design", "image-generation", "midjourney"],
    target_roles: ["freelancer", "agency"],
    author_name: "Maya Patel",
    content: `Midjourney V7 dropped with less fanfare than previous releases, but the changes under the hood are significant.

## What is Actually New

**Draft Mode** is the headline feature. Generate a low-quality image in 10 seconds, iterate on the concept, then upscale when you have the composition right. This changes the ideation workflow fundamentally — explore 30 concepts in the time it used to take to generate 5.

**Personalization** has matured. After training on 50 (previously 200) of your preferred images, V7 now generates images significantly closer to your aesthetic from prompt 1.

**Native editing** — select and redraw regions — reduces the need for Photoshop for simple corrections.

## Quality: V6 vs V7

Honest assessment: **V7 is better at realism, weaker at artistic abstraction** compared to V6.

> **Recommendation:** Switch to V7 for commercial work. Keep V6 style codes for artistic projects.

## Pricing Has Not Changed

Midjourney held pricing steady while improving the model. The Standard plan at $30/month remains the best value for professional use.`,
  },
];

const STACKS = [
  {
    slug: "content-creator-pro",
    name: "Content Creator Pro Stack",
    clone_count: 1234,
    rating: 4.9,
    featured: true,
    description:
      "The ultimate toolkit for content teams. Write, design, and distribute faster with AI.",
    target_role: "freelancer",
    category: "content",
    tool_slugs: [
      "chatgpt-pro",
      "notion-ai",
      "midjourney",
      "runway-ml",
      "zapier",
    ],
  },
  {
    slug: "agency-operations",
    name: "Agency Operations Stack",
    clone_count: 892,
    rating: 4.7,
    featured: true,
    description:
      "Run your agency on autopilot with these 5 essential tools for client delivery.",
    target_role: "agency",
    category: "operations",
    tool_slugs: ["notion-ai", "zapier", "make", "jasper-ai", "surfer-seo"],
  },
  {
    slug: "saas-founder-bootstrap",
    name: "SaaS Founder Bootstrap Stack",
    clone_count: 756,
    rating: 4.8,
    featured: true,
    description:
      "Ship your MVP with minimal budget. Proven by 50+ indie founders.",
    target_role: "saas-founder",
    category: "startup",
    tool_slugs: ["cursor", "claude", "v0-vercel", "zapier", "chatgpt-pro"],
  },
  {
    slug: "developer-productivity",
    name: "Developer Productivity Stack",
    clone_count: 543,
    rating: 4.7,
    featured: false,
    description:
      "The AI tools top engineers use to 10x their output without burning out.",
    target_role: "saas-founder",
    category: "development",
    tool_slugs: [
      "cursor",
      "github-copilot",
      "claude",
      "v0-vercel",
      "perplexity-ai",
    ],
  },
  {
    slug: "creative-agency-design",
    name: "Creative Agency Design Stack",
    clone_count: 387,
    rating: 4.6,
    featured: false,
    description:
      "AI-powered design workflow for creative teams that need to move fast on every brief.",
    target_role: "agency",
    category: "design",
    tool_slugs: [
      "midjourney",
      "canva",
      "elevenlabs",
      "runway-ml",
      "chatgpt-pro",
    ],
  },
];

// ─────────────────────────── SEED FUNCTIONS ──────────────────────────────────

async function seedAuthors() {
  console.log("\n📝 Seeding authors…");
  // Check which authors already exist by name
  const { data: existing } = await supabase.from("authors").select("id,name");
  const existingNames = new Set((existing ?? []).map((a) => a.name));
  const map = {};
  for (const a of existing ?? []) map[a.name] = a.id;

  const toInsert = AUTHORS.filter((a) => !existingNames.has(a.name));
  if (toInsert.length > 0) {
    const { data, error } = await supabase
      .from("authors")
      .insert(toInsert)
      .select("id,name");
    if (error) {
      err("authors insert", error);
    }
    for (const a of data ?? []) map[a.name] = a.id;
  }
  ok(`${Object.keys(map).length} authors ready`);
  return map;
}

async function seedTools() {
  console.log("\n🔧 Seeding tools…");
  // Map our data to the REAL column names in the DB
  const rows = TOOLS.map(
    ({
      scores,
      pricing,
      short_description,
      website,
      has_free,
      featured,
      subcategories,
      badges,
      platforms,
      integrations,
      best_for,
      pros,
      cons,
      ...rest
    }) => ({
      name: rest.name,
      slug: rest.slug,
      tagline: short_description,
      description: rest.description,
      website_url: website,
      category: rest.category,
      subcategory: Array.isArray(subcategories) ? subcategories[0] : null,
      tags: badges ?? [],
      pricing_model: has_free ? "freemium" : "paid",
      pricing_details: pricing ?? [],
      rating: rest.rating,
      review_count: rest.review_count,
      africa_friendly: rest.africa_friendly,
      is_featured: featured,
      is_verified: true,
      is_new: (rest.badges ?? []).includes("new"),
      status: "active",
      has_api:
        (badges ?? []).includes("API") || (integrations ?? []).includes("API"),
      upvote_count: Math.floor(Math.random() * 500),
      save_count: Math.floor(Math.random() * 300),
    }),
  );
  const { data, error } = await supabase
    .from("tools")
    .upsert(rows, { onConflict: "slug" })
    .select("id,slug");
  if (error) {
    err("tools", error);
    return {};
  }
  const map = {};
  for (const t of data ?? []) map[t.slug] = t.id;
  ok(`${data?.length} tools`);
  return map;
}

async function seedToolScores(toolMap) {
  console.log("\n⭐ Seeding tool scores…");
  const rows = TOOLS.filter((t) => toolMap[t.slug]).map((t) => ({
    tool_id: toolMap[t.slug],
    ...t.scores,
  }));
  const { error } = await supabase
    .from("tool_scores")
    .upsert(rows, { onConflict: "tool_id" });
  if (error) err("tool_scores", error);
  else ok(`${rows.length} tool scores`);
}

async function seedToolPricing(toolMap) {
  console.log("\n💰 Seeding tool pricing…");
  const rows = TOOLS.flatMap((t) =>
    (t.pricing ?? []).map((p) => ({ tool_id: toolMap[t.slug], ...p })),
  ).filter((r) => r.tool_id);
  const toolIds = [...new Set(rows.map((r) => r.tool_id))];
  await supabase.from("tool_pricing").delete().in("tool_id", toolIds);
  const { error } = await supabase.from("tool_pricing").insert(rows);
  if (error) err("tool_pricing", error);
  else ok(`${rows.length} pricing tiers`);
}

async function seedAlternatives(toolMap) {
  console.log("\n🔁 Seeding tool alternatives…");
  const pairs = [
    ["chatgpt-pro", "claude", 0.9],
    ["cursor", "github-copilot", 0.85],
    ["zapier", "make", 0.88],
    ["midjourney", "canva", 0.6],
    ["jasper-ai", "chatgpt-pro", 0.7],
    ["v0-vercel", "cursor", 0.6],
    ["surfer-seo", "jasper-ai", 0.55],
    ["perplexity-ai", "chatgpt-pro", 0.65],
  ];
  const rows = pairs.flatMap(([a, b, score]) => {
    const aId = toolMap[a],
      bId = toolMap[b];
    if (!aId || !bId) return [];
    return [
      { tool_id: aId, alternative_id: bId, similarity_score: score },
      { tool_id: bId, alternative_id: aId, similarity_score: score },
    ];
  });
  const { error } = await supabase
    .from("tool_alternatives")
    .upsert(rows, { onConflict: "tool_id,alternative_id" });
  if (error) err("tool_alternatives", error);
  else ok(`${rows.length} alternative pairs`);
}

async function seedArticles(authorMap) {
  console.log("\n📰 Seeding articles…");

  // Category slug -> UUID mapping from the real DB
  const CATEGORY_MAP = {
    "ai-tools": "3d3a2d80-8ff5-4ea2-a62b-ff4359471855",
    comparisons: "cc0ee760-4c73-429f-82c2-0cbe1d5be507",
    tutorials: "dd82eb59-fef0-4e48-99b4-9977eec0bd58",
    "industry-trends": "d69ba1b8-bdca-451a-9d36-ee61ccab10ef",
    saas: "883147bd-fa85-4bea-9a36-a4276041235c",
    ai: "7b9cffa4-29e7-40f5-adee-d35c3586d76a",
    "africa-tech": "b77a3eea-a78c-457d-8080-194e70c52185",
  };

  const rows = ARTICLES.map(
    ({ author_name, category, read_time, featured, target_roles, ...a }) => ({
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: a.content,
      tags: a.tags,
      category_id: CATEGORY_MAP[category] ?? CATEGORY_MAP["ai-tools"],
      status: "published",
      is_featured: featured ?? false,
      is_ai_generated: false,
      is_premium: false,
      is_breaking: false,
      reading_time: read_time ?? 5,
      word_count: Math.round((a.content ?? "").split(/\s+/).length),
      view_count: Math.floor(Math.random() * 4000 + 500),
      like_count: Math.floor(Math.random() * 200),
      share_count: Math.floor(Math.random() * 50),
      comment_count: Math.floor(Math.random() * 30),
      seo_title: a.title,
      seo_description: a.excerpt,
      published_at: new Date(
        Date.now() - Math.random() * 14 * 86400000,
      ).toISOString(),
    }),
  );
  const { data, error } = await supabase
    .from("articles")
    .upsert(rows, { onConflict: "slug" })
    .select("id,slug");
  if (error) err("articles", error);
  else ok(`${data?.length} articles`);
}

async function seedStacks(toolMap) {
  console.log("\n📦 Seeding stacks…");
  const stackRows = STACKS.map(({ tool_slugs, ...s }) => s);
  const { data, error } = await supabase
    .from("stacks")
    .upsert(stackRows, { onConflict: "slug" })
    .select("id,slug");
  if (error) {
    err("stacks", error);
    return;
  }
  const stackMap = {};
  for (const s of data ?? []) stackMap[s.slug] = s.id;

  const toolLinks = STACKS.flatMap((s) =>
    (s.tool_slugs ?? [])
      .map((slug, position) => ({
        stack_id: stackMap[s.slug],
        tool_id: toolMap[slug],
        position,
      }))
      .filter((r) => r.stack_id && r.tool_id),
  );
  const stackIds = Object.values(stackMap);
  await supabase.from("stack_tools").delete().in("stack_id", stackIds);
  const { error: stErr } = await supabase.from("stack_tools").insert(toolLinks);
  if (stErr) err("stack_tools", stErr);
  else ok(`${data?.length} stacks + ${toolLinks.length} tool links`);
}

// ─────────────────────────── MAIN ────────────────────────────────────────────

async function main() {
  console.log("🌱 FutureStack News — Database Seed\n" + "─".repeat(40));
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error("\n❌ Missing env vars. Check .env.local\n");
    process.exit(1);
  }
  const authorMap = await seedAuthors();
  const toolMap = await seedTools();
  await seedToolScores(toolMap);
  await seedToolPricing(toolMap);
  await seedAlternatives(toolMap);
  await seedArticles(authorMap);
  await seedStacks(toolMap);
  console.log(
    "\n" + "─".repeat(40) + "\n✅ Seed complete! Your app now has real data.\n",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
