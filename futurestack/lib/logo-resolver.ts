/**
 * Maps known tool names to their local branded SVG logos.
 * Falls back to Clearbit API for unknown tools.
 */

const LOGO_MAP: Record<string, string> = {
  // AI Writing & Chat
  chatgpt: "/tools/chatgpt.svg",
  "chatgpt pro": "/tools/chatgpt.svg",
  "chatgpt plus": "/tools/chatgpt.svg",
  openai: "/tools/chatgpt.svg",
  claude: "/tools/claude.svg",
  "claude ai": "/tools/claude.svg",
  anthropic: "/tools/claude.svg",
  grammarly: "/tools/grammarly.svg",
  jasper: "/tools/jasper.svg",
  "jasper ai": "/tools/jasper.svg",
  gemini: "/tools/google.svg",
  "google gemini": "/tools/google.svg",

  // AI Image & Design
  midjourney: "/tools/midjourney.svg",
  canva: "/tools/canva.svg",
  figma: "/tools/figma.svg",
  "dall-e": "/tools/dalle.svg",
  dalle: "/tools/dalle.svg",
  "stable diffusion": "/tools/stability.svg",
  "stability ai": "/tools/stability.svg",

  // AI Video & Audio
  runway: "/tools/runway.svg",
  "runway ml": "/tools/runway.svg",
  elevenlabs: "/tools/elevenlabs.svg",
  invideo: "/tools/invideo.svg",

  // Code & Dev
  cursor: "/tools/cursor.svg",
  "github copilot": "/tools/github.svg",
  copilot: "/tools/github.svg",
  github: "/tools/github.svg",
  vercel: "/tools/vercel.svg",
  postman: "/tools/postman.svg",
  linear: "/tools/linear.svg",

  // Productivity & Automation
  notion: "/tools/notion.svg",
  "notion ai": "/tools/notion.svg",
  zapier: "/tools/zapier.svg",
  slack: "/tools/slack.svg",
  airtable: "/tools/airtable.svg",
  hubspot: "/tools/hubspot.svg",

  // Analytics & Payments
  stripe: "/tools/stripe.svg",
  dropbox: "/tools/dropbox.svg",

  // AI Meetings
  fireflies: "/tools/fireflies.svg",
  "fireflies.ai": "/tools/fireflies.svg",
};

/**
 * Resolves the best available logo URL for a tool.
 * Priority: local SVG map -> existing logo -> Clearbit API -> empty
 */
export function resolveToolLogo(
  name: string,
  existingLogo?: string | null,
  website?: string | null,
): string {
  const key = name.toLowerCase().trim();

  // 1. Check exact match in local SVG map
  if (LOGO_MAP[key]) return LOGO_MAP[key];

  // 2. Partial match (e.g., "ChatGPT Plus x2" matches "chatgpt")
  for (const [mapKey, mapValue] of Object.entries(LOGO_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return mapValue;
  }

  // 3. Use any stored logo URL as-is (Clearbit, Cloudinary, etc.)
  if (existingLogo && existingLogo.trim() !== "") {
    return existingLogo;
  }

  // 4. Build Google favicon URL from website domain as final fallback
  // Google's S2 favicon service works for every domain including unusual TLDs
  if (website) {
    try {
      const hostname = new URL(website).hostname;
      const parts = hostname.split(".");
      const rootDomain = parts.length > 2 ? parts.slice(-2).join(".") : hostname;
      return `https://www.google.com/s2/favicons?domain=${rootDomain}&sz=128`;
    } catch {
      // Invalid URL
    }
  }

  return "";
}
