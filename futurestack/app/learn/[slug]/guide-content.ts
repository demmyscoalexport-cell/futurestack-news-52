import fs from "fs";
import path from "path";
import { GUIDES as GUIDES_META, type Guide } from "./guide-metadata";

export type { Guide };
export { GUIDES_META as GUIDES };

function loadGuideContent(slug: string): string {
  try {
    const filePath = path.join(
      process.cwd(),
      "app",
      "learn",
      "[slug]",
      "guides",
      `${slug}.md`
    );
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

export function getGuideBySlug(slug: string): (Guide & { content: string }) | undefined {
  const meta = GUIDES_META.find((g) => g.slug === slug);
  if (!meta) return undefined;
  return { ...meta, content: loadGuideContent(slug) };
}

export function getRelatedGuides(currentSlug: string, category: string, limit = 3): Guide[] {
  const sameCategory = GUIDES_META.filter(
    (g) => g.slug !== currentSlug && g.category === category
  );
  const others = GUIDES_META.filter(
    (g) => g.slug !== currentSlug && g.category !== category
  );
  return [...sameCategory, ...others].slice(0, limit);
}
