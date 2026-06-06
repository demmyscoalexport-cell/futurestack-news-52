import type { BlogPost, BlogListItem } from "./types";

export function formatBlogDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatBlogDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function extractHeadings(content: string): {
  id: string;
  text: string;
  level: number;
}[] {
  const headingRegex = /^(#{1,4})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    headings.push({ id, text, level });
  }

  return headings;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncateExcerpt(text: string, maxLength = 160): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, text.lastIndexOf(" ", maxLength)) + "…";
}

export const BLOG_CATEGORIES = [
  { slug: "ai-tools", name: "AI Tools", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  { slug: "ai-writing", name: "AI Writing", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { slug: "ai-video", name: "AI Video", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  { slug: "ai-image", name: "AI Image", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { slug: "ai-coding", name: "AI Coding", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  { slug: "productivity", name: "Productivity", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { slug: "marketing", name: "Marketing", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  { slug: "automation", name: "Automation", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  { slug: "startups", name: "Startups", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  { slug: "seo", name: "SEO", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  { slug: "design", name: "Design", color: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20" },
  { slug: "tutorials", name: "Tutorials", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  { slug: "comparisons", name: "Comparisons", color: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  { slug: "case-studies", name: "Case Studies", color: "bg-lime-500/10 text-lime-400 border-lime-500/20" },
  { slug: "industry-reports", name: "Industry Reports", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
] as const;

export function getCategoryStyle(slug: string): string {
  const cat = BLOG_CATEGORIES.find((c) => c.slug === slug);
  return cat?.color ?? "bg-secondary text-muted-foreground border-border/40";
}

export function getCategoryName(slug: string): string {
  const cat = BLOG_CATEGORIES.find((c) => c.slug === slug);
  return cat?.name ?? slug;
}
