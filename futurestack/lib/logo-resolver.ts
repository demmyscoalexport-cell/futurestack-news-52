/**
 * Real brand logo resolver.
 * Priority: name-based map (simple-icons CDN or Google favicon) → stored non-Clearbit URL → Google favicon from website
 *
 * Clearbit (logo.clearbit.com) is blocked in this environment — never use it.
 * simple-icons CDN: https://cdn.simpleicons.org/{slug}[/{hexcolor}]
 * Google favicon: https://www.google.com/s2/favicons?domain={domain}&sz=128
 */

const SI = "https://cdn.simpleicons.org";
const GF = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

const LOGO_MAP: Record<string, string> = {
  // ── AI Chat & Writing ──────────────────────────────────────────────────────
  "chatgpt":         GF("openai.com"),
  "openai":          GF("openai.com"),
  "dall-e":          GF("openai.com"),
  "dalle":           GF("openai.com"),
  "claude":          `${SI}/anthropic/FFFFFF`,
  "anthropic":       `${SI}/anthropic/FFFFFF`,
  "gemini":          `${SI}/googlegemini`,
  "google gemini":   `${SI}/googlegemini`,
  "notebooklm":      `${SI}/googlegemini`,
  "grammarly":       `${SI}/grammarly`,
  "grammarly go":    `${SI}/grammarly`,
  "jasper ai":       GF("jasper.ai"),
  "jasper":          GF("jasper.ai"),
  "copy.ai":         GF("copy.ai"),
  "writesonic":      GF("writesonic.com"),
  "quillbot":        GF("quillbot.com"),
  "perplexity ai":   GF("perplexity.ai"),
  "perplexity":      GF("perplexity.ai"),

  // ── AI Image & Design ─────────────────────────────────────────────────────
  "midjourney":      GF("midjourney.com"),
  "canva ai":        GF("canva.com"),
  "canva":           GF("canva.com"),
  "figma ai":        `${SI}/figma`,
  "figma":           `${SI}/figma`,
  "ideogram":        GF("ideogram.ai"),
  "leonardo ai":     GF("leonardo.ai"),
  "adobe firefly":   GF("adobe.com"),
  "stable diffusion": GF("stability.ai"),
  "stability ai":    GF("stability.ai"),
  "pika labs":       GF("pika.art"),

  // ── AI Video & Audio ──────────────────────────────────────────────────────
  "runway ml":       GF("runwayml.com"),
  "runway":          GF("runwayml.com"),
  "elevenlabs":      `${SI}/elevenlabs/FFFFFF`,
  "invideo ai":      GF("invideo.io"),
  "invideo":         GF("invideo.io"),
  "heygen":          GF("heygen.com"),
  "synthesia":       GF("synthesia.io"),
  "descript":        GF("descript.com"),
  "murf ai":         GF("murf.ai"),
  "murf":            GF("murf.ai"),
  "speechify":       GF("speechify.com"),
  "suno ai":         GF("suno.com"),
  "suno":            GF("suno.com"),
  "opus clip":       GF("opus.pro"),
  "play.ht":         GF("play.ht"),
  "playht":          GF("play.ht"),

  // ── Code & Dev ────────────────────────────────────────────────────────────
  "cursor":          `${SI}/cursor/FFFFFF`,
  "github copilot":  `${SI}/github/FFFFFF`,
  "copilot":         `${SI}/github/FFFFFF`,
  "github":          `${SI}/github/FFFFFF`,
  "vercel":          `${SI}/vercel/FFFFFF`,
  "v0 by vercel":    `${SI}/vercel/FFFFFF`,
  "v0":              GF("v0.dev"),
  "postman":         `${SI}/postman`,
  "linear ai":       `${SI}/linear`,
  "linear":          `${SI}/linear`,
  "replit ai":       GF("replit.com"),
  "replit":          GF("replit.com"),
  "codeium":         GF("codeium.com"),
  "lovable":         GF("lovable.dev"),
  "bolt ai":         GF("bolt.new"),
  "bolt":            GF("bolt.new"),
  "framer ai":       GF("framer.com"),
  "framer":          GF("framer.com"),

  // ── Productivity & Automation ─────────────────────────────────────────────
  "notion ai":       `${SI}/notion/FFFFFF`,
  "notion":          `${SI}/notion/FFFFFF`,
  "zapier":          `${SI}/zapier`,
  "slack":           GF("slack.com"),
  "airtable":        `${SI}/airtable`,
  "hubspot":         `${SI}/hubspot`,
  "make":            GF("make.com"),
  "n8n":             GF("n8n.io"),
  "loom ai":         GF("loom.com"),
  "loom":            GF("loom.com"),
  "dropbox":         `${SI}/dropbox`,
  "motion":          GF("usemotion.com"),
  "typeform ai":     GF("typeform.com"),
  "typeform":        GF("typeform.com"),
  "gamma app":       GF("gamma.app"),
  "gamma":           GF("gamma.app"),

  // ── Analytics & Research ─────────────────────────────────────────────────
  "mixpanel":        GF("mixpanel.com"),
  "posthog":         GF("posthog.com"),
  "surfer seo":      GF("surferseo.com"),
  "surfer":          GF("surferseo.com"),
  "elicit":          GF("elicit.com"),
  "stripe":          `${SI}/stripe`,

  // ── AI Meetings ──────────────────────────────────────────────────────────
  "fireflies ai":    GF("fireflies.ai"),
  "fireflies":       GF("fireflies.ai"),
  "fathom ai":       GF("fathom.video"),
  "fathom":          GF("fathom.video"),
  "otter ai":        GF("otter.ai"),
  "otter":           GF("otter.ai"),

  // ── Other ────────────────────────────────────────────────────────────────
  "bardeen ai":      GF("bardeen.ai"),
  "bardeen":         GF("bardeen.ai"),
  "predis ai":       GF("predis.ai"),
  "predis":          GF("predis.ai"),
};

/**
 * Resolves the best available logo URL for a tool.
 * Priority:
 *  1. name-based LOGO_MAP (real brand logos via simple-icons or Google favicon)
 *  2. stored logo URL if it's not a blocked Clearbit URL
 *  3. Google favicon derived from the tool's website URL
 */
export function resolveToolLogo(
  name: string,
  existingLogo?: string | null,
  website?: string | null,
): string {
  const key = name.toLowerCase().trim();

  // 1. Exact name match
  if (LOGO_MAP[key]) return LOGO_MAP[key];

  // 2. Partial name match (handles suffixes like "Plus", "Pro")
  for (const [mapKey, mapValue] of Object.entries(LOGO_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return mapValue;
  }

  // 3. Use stored URL only if it's not Clearbit (blocked in this env)
  if (
    existingLogo &&
    existingLogo.trim() !== "" &&
    !existingLogo.includes("clearbit.com")
  ) {
    return existingLogo;
  }

  // 4. Google favicon from the tool's website (works for every domain)
  if (website) {
    try {
      const hostname = new URL(website).hostname;
      const parts = hostname.split(".");
      const rootDomain =
        parts.length > 2 ? parts.slice(-2).join(".") : hostname;
      return GF(rootDomain);
    } catch {
      // invalid URL — fall through
    }
  }

  return "";
}
