export interface SeoLandingPage {
  slug: string;
  title: string;
  headline: string;
  description: string;
  searchQuery: string;
  categories?: string[];
  tags?: string[];
  africaFocus?: boolean;
  freeOnly?: boolean;
}

export const SEO_LANDING_PAGES: SeoLandingPage[] = [
  {
    slug: "ai-tools-for-students",
    title: "Best AI Tools for Students (2026)",
    headline: "Best AI Tools for Students",
    description:
      "Free and affordable AI tools for studying, research, writing, and building projects — curated for students worldwide and in Africa.",
    searchQuery: "students learning research writing free",
    categories: ["writing", "productivity", "education"],
    freeOnly: true,
  },
  {
    slug: "free-ai-tools",
    title: "Best Free AI Tools (2026)",
    headline: "Best Free AI Tools",
    description:
      "Discover powerful free AI tools for writing, design, coding, video, and automation — no credit card required.",
    searchQuery: "free AI tools",
    freeOnly: true,
  },
  {
    slug: "chatgpt-alternatives",
    title: "Best ChatGPT Alternatives (2026)",
    headline: "ChatGPT Alternatives",
    description:
      "Compare the best ChatGPT alternatives for writing, coding, research, and business — including free and Africa-friendly options.",
    searchQuery: "chatgpt alternative claude gemini",
    categories: ["writing", "code"],
  },
  {
    slug: "ai-tools-for-startups",
    title: "Top AI Tools for Startups (2026)",
    headline: "Top AI Tools for Startups",
    description:
      "The essential AI stack for founders — from MVP building to marketing, automation, and customer support.",
    searchQuery: "startup founder MVP automation",
    categories: ["productivity", "automation", "code", "marketing"],
  },
  {
    slug: "ai-tools-for-nigerian-businesses",
    title: "Best AI Tools for Nigerian Businesses",
    headline: "AI Tools for Nigerian SMEs",
    description:
      "AI tools that work for Nigerian businesses — affordable pricing, mobile-friendly, and practical for local growth.",
    searchQuery: "nigerian business SME africa",
    africaFocus: true,
  },
  {
    slug: "ai-tools-for-content-creators",
    title: "Best AI Tools for Content Creators",
    headline: "AI Tools for Content Creators",
    description:
      "Script writing, voice, video editing, thumbnails, and SEO — the creator stack that saves hours every week.",
    searchQuery: "content creator youtube video writing",
    categories: ["video", "writing", "design", "audio"],
  },
  {
    slug: "ai-coding-assistants",
    title: "Best AI Coding Assistants (2026)",
    headline: "Best AI Coding Assistants",
    description:
      "Compare AI pair programmers and coding agents for faster development, debugging, and shipping.",
    searchQuery: "AI coding assistant copilot cursor",
    categories: ["code"],
  },
  {
    slug: "ai-video-editors",
    title: "Best AI Video Editors (2026)",
    headline: "Best AI Video Editors",
    description:
      "AI-powered video editing tools for creators, marketers, and teams — including free options.",
    searchQuery: "AI video editor free",
    categories: ["video"],
    freeOnly: true,
  },
];

export function getSeoPage(slug: string): SeoLandingPage | undefined {
  return SEO_LANDING_PAGES.find((p) => p.slug === slug);
}
