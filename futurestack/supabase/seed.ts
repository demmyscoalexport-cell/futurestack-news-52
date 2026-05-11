import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const categories = [
  { id: "writing-content", name: "Writing & Content", icon: "pen-tool" },
  { id: "image-generation", name: "Image Generation", icon: "image" },
  { id: "video-audio", name: "Video & Audio", icon: "video" },
  { id: "code-dev", name: "Code & Dev", icon: "code" },
  { id: "research-knowledge", name: "Research & Knowledge", icon: "book" },
  { id: "productivity", name: "Productivity", icon: "layout" },
  { id: "marketing-seo", name: "Marketing & SEO", icon: "trending-up" },
  { id: "design-ux", name: "Design & UX", icon: "figma" },
  { id: "data-analytics", name: "Data & Analytics", icon: "database" },
  { id: "customer-support", name: "Customer Support", icon: "users" },
  { id: "automation", name: "Automation", icon: "zap" },
  { id: "finance-legal", name: "Finance & Legal", icon: "dollar-sign" },
];

const tools = [
  {
    name: "Claude",
    slug: "claude",
    tagline:
      "Anthropic's AI assistant — thoughtful, safe, and remarkably capable",
    description:
      "Claude is Anthropic's flagship AI assistant, designed to be helpful, honest, and harmless.",
    websiteUrl: "https://claude.ai",
    category: "writing-content",
    has_free: true,
    free_description: "Limited daily usage",
    is_featured: true,
    logo: "https://cdn.worldvectorlogo.com/logos/claude-ai-1.svg",
    badges: ["llm", "writing", "coding", "analysis"],
    best_for: ["Founders", "Writers"],
  },
  {
    name: "ChatGPT",
    slug: "chatgpt",
    tagline: "OpenAI's flagship language model",
    description:
      "The world's most widely used AI tool for everything from coding to writing.",
    websiteUrl: "https://chat.openai.com",
    category: "writing-content",
    has_free: true,
    free_description: "Access to GPT-3.5 and limited GPT-4o",
    is_featured: true,
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    badges: ["chat", "llm", "general"],
    best_for: ["Everyone"],
  },
  {
    name: "Midjourney",
    slug: "midjourney",
    tagline: "Top-tier AI image generation",
    description:
      "Create incredibly beautiful, photorealistic and artistic images from text prompts via Discord.",
    websiteUrl: "https://midjourney.com",
    category: "image-generation",
    has_free: false,
    free_description: "",
    is_featured: true,
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png",
    badges: ["image", "art", "design"],
    best_for: ["Designers", "Artists"],
  },
  {
    name: "Cursor",
    slug: "cursor",
    tagline: "AI-first code editor",
    description:
      "A fork of VS Code tailored entirely around AI code generation, refactoring, and codebase understanding.",
    websiteUrl: "https://cursor.so",
    category: "code-dev",
    has_free: true,
    free_description: "Basic usage is free",
    is_featured: true,
    logo: "https://www.cursor.so/brand/icon.svg",
    badges: ["coding", "ide", "developer"],
    best_for: ["Developers", "Engineers"],
  },
  {
    name: "Perplexity AI",
    slug: "perplexity",
    tagline: "Your AI-powered research assistant",
    description:
      "Search engine rebuilt from the ground up using AI to provide immediate answers with citations.",
    websiteUrl: "https://perplexity.ai",
    category: "research-knowledge",
    has_free: true,
    free_description: "Unlimited basic searches",
    is_featured: true,
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/22/Perplexity_AI_logo.svg",
    badges: ["search", "research", "learning"],
    best_for: ["Researchers", "Students"],
  },
  {
    name: "Zapier",
    slug: "zapier",
    tagline: "Automate your work without code",
    description:
      "Connect over 5000 apps and build powerful automation workflows with integrated AI steps.",
    websiteUrl: "https://zapier.com",
    category: "automation",
    has_free: true,
    free_description: "100 tasks/month",
    is_featured: true,
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Zapier_logo.svg",
    badges: ["nocode", "workflow", "automation"],
    best_for: ["Marketers", "Ops"],
  },
  {
    name: "Synthesia",
    slug: "synthesia",
    tagline: "AI video generation studio",
    description:
      "Create professional videos from text using AI avatars and voiceovers.",
    websiteUrl: "https://synthesia.io",
    category: "video-audio",
    has_free: false,
    free_description: "",
    is_featured: false,
    logo: "https://cdn.worldvectorlogo.com/logos/synthesia-1.svg",
    badges: ["video", "avatar", "content"],
    best_for: ["Marketers", "Educators"],
  },
  {
    name: "Notion AI",
    slug: "notion-ai",
    tagline: "The connected workspace with AI",
    description:
      "Bring AI into the place where you already write and organize your documents and projects.",
    websiteUrl: "https://notion.so",
    category: "productivity",
    has_free: false,
    free_description: "",
    is_featured: true,
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
    badges: ["notes", "planning", "writing"],
    best_for: ["Teams", "Founders"],
  },
  {
    name: "Figma AI",
    slug: "figma-ai",
    tagline: "Design tool with generative AI",
    description:
      "Figma has integrated powerful AI components to generate designs, copy, and organize layers.",
    websiteUrl: "https://figma.com",
    category: "design-ux",
    has_free: true,
    free_description: "Basic design usage is free",
    is_featured: true,
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
    badges: ["ui", "ux", "design"],
    best_for: ["Designers", "Product Teams"],
  },
  {
    name: "Runway",
    slug: "runway",
    tagline: "Advancing creativity with artificial intelligence.",
    description:
      "An expansive suite of AI magic tools for video editing, generation, and audio refinement.",
    websiteUrl: "https://runwayml.com",
    category: "video-audio",
    has_free: true,
    free_description: "Free basic quality renders",
    is_featured: false,
    logo: "https://cdn.worldvectorlogo.com/logos/runway-2.svg",
    badges: ["video", "vfx", "creative"],
    best_for: ["Video Editors", "Creators"],
  },
];

async function seed() {
  console.log("Seeding Database...");

  for (const c of categories) {
    await supabase.from("tool_categories").upsert(
      {
        id: c.id,
        name: c.name,
        icon: c.icon,
      },
      { onConflict: "id" },
    );
  }

  for (const t of tools) {
    const { data: toolObj, error } = await supabase
      .from("tools")
      .upsert(
        {
          name: t.name,
          slug: t.slug,
          short_description: t.tagline,
          description: t.description,
          website: t.websiteUrl,
          category: t.category,
          has_free: t.has_free,
          free_description: t.free_description,
          is_featured: t.is_featured,
          logo: t.logo,
          badges: t.badges,
          best_for: t.best_for,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error || !toolObj?.id) {
      console.error("Error inserting tool:", t.name, error);
      continue;
    }

    await supabase.from("tool_scores").upsert(
      {
        tool_id: toolObj.id,
        ease_of_use: (Math.random() * 2 + 7).toFixed(1),
        value_for_money: (Math.random() * 2 + 7).toFixed(1),
        feature_depth: (Math.random() * 2 + 8).toFixed(1),
        support_quality: (Math.random() * 3 + 6).toFixed(1),
        integration_richness: (Math.random() * 3 + 7).toFixed(1),
        ai_capability: (Math.random() * 1 + 9).toFixed(1),
      },
      { onConflict: "tool_id" },
    );

    await supabase.from("tool_pricing").upsert({
      tool_id: toolObj.id,
      tier_name: "Pro",
      price_monthly: 20,
    });
  }

  console.log("Seed Complete!");
}

seed();
