export type ToolRecord = object & {
  id?: string;
  name?: string;
  slug?: string;
  logo?: string | null;
  website?: string;
  website_url?: string;
  short_description?: string;
  shortDescription?: string;
  tagline?: string;
  description?: string;
  is_featured?: boolean;
  featured?: boolean;
  is_new?: boolean;
  has_free?: boolean;
  freeTier?: boolean;
  pricing_model?: string;
  pricingModel?: string;
  tool_pricing?: unknown;
  reviews?: unknown;
  alternatives?: unknown;
  videos?: unknown;
  features?: unknown;
  faqs?: unknown;
};

export interface ToolVideo {
  title: string;
  youtubeUrl: string;
  thumbnail?: string;
  duration?: string;
  creator?: string;
  featured?: boolean;
}

export interface ToolFeature {
  title: string;
  description: string;
  icon?: string;
  priority?: number;
}

export interface ToolFaq {
  question: string;
  answer: string;
  order?: number;
}

export interface ToolComparisonSeed {
  name: string;
  slug: string;
  tagline?: string;
  logo?: string | null;
  pricing_model?: string;
  has_free?: boolean;
}

export function fieldString(tool: ToolRecord, keys: string[], fallback = ""): string {
  const record = tool as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

export function fieldBool(tool: ToolRecord, keys: string[], fallback = false): boolean {
  const record = tool as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return fallback;
}

export function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function fieldList(tool: ToolRecord, keys: string[]): string[] {
  const record = tool as Record<string, unknown>;
  for (const key of keys) {
    const list = stringList(record[key]);
    if (list.length > 0) return list;
  }
  return [];
}

export function getToolName(tool: ToolRecord): string {
  return fieldString(tool, ["name"], "Untitled Tool");
}

export function getToolSlug(tool: ToolRecord): string {
  return fieldString(tool, ["slug"], getToolName(tool).toLowerCase().replace(/\W+/g, "-"));
}

export function getToolWebsite(tool: ToolRecord): string {
  return fieldString(tool, ["website_url", "website", "websiteUrl"]);
}

export function getToolSummary(tool: ToolRecord): string {
  const value = fieldString(tool, ["tagline", "short_description", "shortDescription", "description"]);
  if (!value) return "Software platform for discovering, learning, and improving modern workflows.";
  return value.length > 140 ? `${value.slice(0, 137).trim()}...` : value;
}

export function getToolDescription(tool: ToolRecord): string {
  return fieldString(tool, ["longDescription", "long_description", "description"], getToolSummary(tool));
}

export function getPricingLabel(tool: ToolRecord): string {
  const model = fieldString(tool, ["pricing_model", "pricingModel"]).toLowerCase();
  if (fieldBool(tool, ["has_free", "freeTier"]) && model === "freemium") return "Freemium";
  if (fieldBool(tool, ["has_free", "freeTier"]) || model === "free") return "Free";
  if (model === "enterprise") return "Enterprise";
  if (model === "paid") return "Paid";
  return "Pricing tracked";
}

export function getCategoryLabel(tool: ToolRecord): string {
  const category = fieldString(tool, ["category_name", "categorySlug", "category"], "Software");
  return category.replace(/-/g, " ");
}

export function getSubcategoryLabel(tool: ToolRecord): string {
  return fieldString(tool, ["subcategory_name", "subcategory"], "Productivity");
}

export function getGallery(tool: ToolRecord): string[] {
  const fromList = fieldList(tool, [
    "screenshots",
    "gallery",
    "galleryImages",
    "screenshotGallery",
    "cloudinaryScreenshots",
  ]);
  if (fromList.length > 0) return fromList;
  const record = tool as Record<string, unknown>;
  const raw = record.tool_gallery ?? record.galleryItems;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (typeof item === "string") return [item];
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const url = fieldString(row, ["image_url", "imageUrl", "url"]);
    return url ? [url] : [];
  });
}

export function getHeroVisual(tool: ToolRecord): string {
  const gallery = getGallery(tool);
  return fieldString(tool, ["heroImage", "hero_image", "previewImage", "image", "thumbnail"], gallery[0] ?? "");
}

export function getVideos(tool: ToolRecord): ToolVideo[] {
  const record = tool as Record<string, unknown>;
  const raw = record.videos ?? record.tool_videos ?? record.toolVideos;
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      const youtubeUrl = fieldString(row, ["youtubeUrl", "youtube_url", "embed_url", "url"]);
      if (!youtubeUrl) return [];
      return [{
        title: fieldString(row, ["title"], `${getToolName(tool)} tutorial`),
        youtubeUrl,
        thumbnail: fieldString(row, ["thumbnail", "thumbnailUrl"]),
        duration: fieldString(row, ["duration"]),
        creator: fieldString(row, ["creator"]),
        featured: fieldBool(row, ["featured"]),
      }];
    });
  }
  const url = fieldString(tool, ["youtube_url", "youtubeUrl", "tutorialUrl", "videoUrl"]);
  return url ? [{ title: `${getToolName(tool)} tutorial`, youtubeUrl: url, featured: true }] : [];
}

export function youtubeEmbedUrl(url: string): string {
  const id = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/)?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

export function getFeatures(tool: ToolRecord): ToolFeature[] {
  const record = tool as Record<string, unknown>;
  const raw = record.features ?? record.tool_features ?? record.toolFeatures;
  if (Array.isArray(raw)) {
    return raw.flatMap((item, index) => {
      if (typeof item === "string") {
        return [{ title: item, description: `Use ${getToolName(tool)} for ${item.toLowerCase()}.`, priority: index }];
      }
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      return [{
        title: fieldString(row, ["title", "name"], `Feature ${index + 1}`),
        description: fieldString(row, ["description"], `A core ${getToolName(tool)} capability.`),
        icon: fieldString(row, ["icon"]),
        priority: typeof row.priority === "number" ? row.priority : index,
      }];
    });
  }
  return fieldList(tool, ["tags", "bestFor"]).slice(0, 6).map((tag, index) => ({
    title: tag,
    description: `${getToolName(tool)} supports ${tag.toLowerCase()} workflows with a focused product experience.`,
    priority: index,
  }));
}

export function getPros(tool: ToolRecord): string[] {
  const pros = fieldList(tool, ["pros", "toolPros"]);
  if (pros.length > 0) return pros;
  return ["Clear workflow fit", "Fast setup path", "Useful for repeatable team processes"];
}

export function getCons(tool: ToolRecord): string[] {
  const cons = fieldList(tool, ["cons", "toolCons"]);
  if (cons.length > 0) return cons;
  return ["Advanced workflows may require evaluation", "Pricing and limits should be checked before rollout"];
}

export function getAudience(tool: ToolRecord): string[] {
  const audience = fieldList(tool, ["audience", "targetUsers", "bestFor"]);
  if (audience.length > 0) return audience.slice(0, 10);
  return ["Founders", "Creators", "Marketers", "Developers", "Businesses"];
}

export function getUseCases(tool: ToolRecord): string[] {
  const useCases = fieldList(tool, ["useCases", "toolUseCases", "tags"]);
  if (useCases.length > 0) return useCases.slice(0, 8);
  return ["Research", "Productivity", "Automation", "Team workflows"];
}

export function getFaqs(tool: ToolRecord): ToolFaq[] {
  const record = tool as Record<string, unknown>;
  const raw = record.faqs ?? record.tool_faqs ?? record.toolFAQs;
  if (Array.isArray(raw)) {
    return raw.flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      const question = fieldString(row, ["question"]);
      const answer = fieldString(row, ["answer"]);
      if (!question || !answer) return [];
      return [{ question, answer, order: typeof row.order === "number" ? row.order : index }];
    });
  }
  const name = getToolName(tool);
  return [
    {
      question: `What is ${name} best for?`,
      answer: `${name} is best for teams and individuals evaluating ${getCategoryLabel(tool).toLowerCase()} workflows.`,
      order: 0,
    },
    {
      question: `Does ${name} offer a free plan?`,
      answer: fieldBool(tool, ["has_free", "freeTier"])
        ? `${name} is marked as offering a free or freemium option. Confirm current limits on the official website.`
        : `Current pricing is tracked as ${getPricingLabel(tool).toLowerCase()}. Confirm plan details before buying.`,
      order: 1,
    },
  ];
}

export function getIsVerified(tool: ToolRecord): boolean {
  return fieldBool(tool, ["is_verified", "verified", "isVerified"]);
}

export function getLastUpdated(tool: ToolRecord): string {
  return fieldString(tool, ["last_updated", "lastUpdated", "updated_at", "updatedAt"]);
}

export function formatLastUpdated(tool: ToolRecord): string {
  const raw = getLastUpdated(tool);
  if (!raw) return "Recently tracked";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Recently tracked";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function getPlatforms(tool: ToolRecord): string[] {
  const platforms = fieldList(tool, ["platforms", "supportedPlatforms"]);
  if (platforms.length > 0) return platforms;
  return ["Web"];
}

export function getPlatformsLabel(tool: ToolRecord): string {
  return getPlatforms(tool).slice(0, 3).join(" · ");
}

export function getRating(tool: ToolRecord): number {
  const record = tool as Record<string, unknown>;
  const rating = record.rating ?? record.avg_rating;
  return typeof rating === "number" ? rating : 0;
}

export function getReviewCount(tool: ToolRecord): number {
  const record = tool as Record<string, unknown>;
  const count = record.review_count ?? record.reviewCount;
  return typeof count === "number" ? count : 0;
}

export function getAlternatives(tool: ToolRecord): ToolComparisonSeed[] {
  const record = tool as Record<string, unknown>;
  const raw = record.alternatives;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const slug = fieldString(row, ["slug"]);
    if (!slug) return [];
    return [{
      name: fieldString(row, ["name"], "Alternative"),
      slug,
      tagline: fieldString(row, ["tagline"]),
      logo: fieldString(row, ["logo"]) || null,
      pricing_model: fieldString(row, ["pricing_model"]),
      has_free: fieldBool(row, ["has_free"]),
    }];
  });
}

export function getGalleryItems(tool: ToolRecord): string[] {
  return getGallery(tool);
}

export function getHeroCarouselImages(tool: ToolRecord): string[] {
  const hero = getHeroVisual(tool);
  const gallery = getGalleryItems(tool);
  const images = [hero, ...gallery].filter((url, index, arr) => Boolean(url) && arr.indexOf(url) === index);
  return images.slice(0, 6);
}

export function getLongDescription(tool: ToolRecord): string {
  const long = fieldString(tool, ["long_description", "longDescription"]);
  if (long) return long;
  return getToolDescription(tool);
}

export interface VerificationCheck {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export function getVerificationChecks(tool: ToolRecord): VerificationCheck[] {
  const name = getToolName(tool);
  const website = getToolWebsite(tool);
  const lastUpdated = getLastUpdated(tool);
  const updatedAt = lastUpdated ? new Date(lastUpdated).getTime() : 0;
  const hasRecentUpdate =
    updatedAt > 0 && Date.now() - updatedAt < 365 * 24 * 60 * 60 * 1000;

  return [
    {
      id: "website",
      label: "Official website on file",
      passed: Boolean(website),
      detail: website ? "Tracked affiliate link available" : "No website URL recorded",
    },
    {
      id: "verified",
      label: "DISCOVA verified listing",
      passed: getIsVerified(tool),
      detail: getIsVerified(tool) ? `${name} passed editorial review` : "Pending verification",
    },
    {
      id: "active",
      label: "Active product status",
      passed: fieldString(tool, ["status"], "active") === "active",
      detail: "Listed as an active product",
    },
    {
      id: "updated",
      label: "Recently updated profile",
      passed: hasRecentUpdate || Boolean(lastUpdated),
      detail: `Last tracked ${formatLastUpdated(tool)}`,
    },
    {
      id: "africa",
      label: "Africa accessibility reviewed",
      passed: fieldBool(tool, ["africa_friendly", "africaFriendly"]),
      detail: fieldBool(tool, ["africa_friendly", "africaFriendly"])
        ? "Marked Africa-friendly on DISCOVA"
        : "Global availability profile",
    },
  ];
}

export function getInsightChips(tool: ToolRecord): string[] {
  const chips: string[] = [];
  if (getIsVerified(tool)) chips.push("Verified");
  chips.push(getPricingLabel(tool));
  chips.push(getPlatformsLabel(tool));
  if (fieldBool(tool, ["is_featured", "featured"])) chips.push("Featured");
  if (fieldBool(tool, ["is_new"])) chips.push("Trending");
  const rating = getRating(tool);
  if (rating > 0) chips.push(`${rating.toFixed(1)} ★`);
  return chips.slice(0, 5);
}

export function getAiSummaries(tool: ToolRecord): { short: string; medium: string; deep: string } {
  const name = getToolName(tool);
  const summary = getToolSummary(tool);
  const category = getCategoryLabel(tool).toLowerCase();
  return {
    short: fieldString(tool, ["aiSummary30", "ai_summary_30"], `${name} helps users handle ${category} workflows with a focused, modern product experience.`),
    medium: fieldString(tool, ["aiSummary120", "ai_summary_120"], `${summary} It is most useful when teams need to compare capabilities, pricing, setup effort, and workflow fit before committing to another software subscription.`),
    deep: fieldString(tool, ["aiDeepAnalysis", "ai_deep_analysis"], `${name} matters because software buyers increasingly need practical context, not only vendor claims. Evaluate it by looking at setup complexity, collaboration features, pricing limits, integrations, learning resources, and whether the product matches the workflow you are trying to improve.`),
  };
}

export function getLongDescriptionSections(tool: ToolRecord): Array<{ title: string; body: string }> {
  const name = getToolName(tool);
  const long = fieldString(tool, ["long_description", "longDescription"]);
  if (long.length > 200) {
    const paragraphs = long.split(/\n\n+/).map((part) => part.trim()).filter(Boolean);
    if (paragraphs.length >= 2) {
      return paragraphs.slice(0, 4).map((body, index) => ({
        title: index === 0 ? `About ${name}` : `${name} in depth`,
        body,
      }));
    }
    return [{ title: `About ${name}`, body: long }];
  }
  const description = getToolDescription(tool);
  return [
    { title: `What ${name} does`, body: description },
    { title: "How it works", body: `${name} fits into ${getCategoryLabel(tool).toLowerCase()} workflows by combining its core product surface with repeatable actions, learning resources, and integrations that help users move from evaluation to execution.` },
    { title: "Who should consider it", body: `${getAudience(tool).join(", ")} can use ${name} to compare capabilities, understand tradeoffs, and decide whether it belongs in their software stack.` },
    { title: "Limitations to evaluate", body: getCons(tool).join(" ") },
  ];
}

