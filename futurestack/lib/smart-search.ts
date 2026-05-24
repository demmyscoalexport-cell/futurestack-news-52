export interface SmartSearchIntent {
  /** Primary text query for ILIKE search */
  query: string;
  category?: string;
  freeOnly?: boolean;
  africaOnly?: boolean;
  /** Direct SEO landing page when query matches exactly */
  redirect?: string;
  /** Human-readable intent label */
  label?: string;
}

const REDIRECT_MAP: [RegExp, string][] = [
  [/best\s+ai\s+for\s+students|ai\s+tools?\s+for\s+students?/i, "/best/ai-tools-for-students"],
  [/free\s+ai\s+tools?|best\s+free\s+ai/i, "/best/free-ai-tools"],
  [/chatgpt\s+alternatives?|tools?\s+like\s+chatgpt|like\s+chatgpt/i, "/best/chatgpt-alternatives"],
  [/ai\s+tools?\s+for\s+startups?|startup\s+ai\s+tools?/i, "/best/ai-tools-for-startups"],
  [/nigerian|nigeria\s+sme|ai\s+for\s+nigerian/i, "/best/ai-tools-for-nigerian-businesses"],
  [/content\s+creators?|youtubers?|creator\s+ai/i, "/best/ai-tools-for-content-creators"],
  [/coding\s+assistants?|ai\s+cod(e|ing)/i, "/best/ai-coding-assistants"],
  [/video\s+editors?|free\s+ai\s+video/i, "/best/ai-video-editors"],
];

const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/\b(writing|copy|blog|content\s+writing)\b/i, "writing"],
  [/\b(cod(e|ing)|developer|programming|dev\s+tools?)\b/i, "code"],
  [/\b(design|ui|ux|logo|figma|image\s+gen)\b/i, "design"],
  [/\b(video|youtube|film|edit)\b/i, "video"],
  [/\b(audio|voice|podcast|music)\b/i, "audio"],
  [/\b(automation|workflow|zapier|integrat)\b/i, "automation"],
  [/\b(productivity|task|notes|notion)\b/i, "productivity"],
  [/\b(marketing|seo|ads|growth|sales)\b/i, "marketing"],
  [/\b(analytics|data|research|insights)\b/i, "analytics"],
];

export function parseSmartSearch(raw: string): SmartSearchIntent {
  const input = raw.trim();
  if (!input) return { query: "" };

  for (const [pattern, path] of REDIRECT_MAP) {
    if (pattern.test(input)) {
      return { query: input, redirect: path, label: input };
    }
  }

  const freeOnly = /\b(free|no\s+cost|budget|cheap|affordable)\b/i.test(input);
  const africaOnly = /\b(africa|african|nigeria|nigerian|kenya|ghana|sme|mpesa|naira|3g)\b/i.test(input);

  let category: string | undefined;
  for (const [pattern, cat] of CATEGORY_KEYWORDS) {
    if (pattern.test(input)) {
      category = cat;
      break;
    }
  }

  // Strip filler words for cleaner DB search
  const query = input
    .replace(/\b(best|top|good|great|tools?\s+like|ai\s+for|for\s+my|what\s+is\s+the)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    query: query || input,
    category,
    freeOnly,
    africaOnly,
    label: input,
  };
}

export function buildToolsSearchUrl(intent: SmartSearchIntent): string {
  if (intent.redirect) return intent.redirect;
  const params = new URLSearchParams();
  if (intent.query) params.set("search", intent.query);
  if (intent.category) params.set("category", intent.category);
  if (intent.freeOnly) params.set("free", "1");
  if (intent.africaOnly) params.set("africa", "1");
  const qs = params.toString();
  return qs ? `/tools?${qs}` : "/tools";
}
