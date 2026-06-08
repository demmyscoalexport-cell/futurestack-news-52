import { ImageResponse } from "next/og";
import { getToolBySlugCached } from "@/lib/queries/tools";
import { tools as fallbackTools } from "@/lib/data";
import {
  fieldBool,
  getPricingLabel,
  getRating,
  getReviewCount,
  getToolName,
  getToolSummary,
  type ToolRecord,
} from "@/lib/tool-intelligence";

export const runtime = "nodejs";

async function loadToolForOg(slug: string): Promise<ToolRecord | null> {
  try {
    const tool = await getToolBySlugCached(slug);
    if (tool) return tool as ToolRecord;
  } catch {
    // Fall through to static data for preview builds.
  }
  const mock = fallbackTools.find((item) => item.slug === slug);
  if (!mock) return null;
  return {
    ...mock,
    short_description: mock.shortDescription,
    has_free: mock.pricing.hasFree,
    pricing_model: mock.pricing.hasFree ? "freemium" : "paid",
    website_url: mock.website,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug") ?? "";
    const loaded = slug ? await loadToolForOg(slug) : null;

    const name = loaded ? getToolName(loaded) : "DISCOVA Tool";
    const tagline = loaded ? getToolSummary(loaded) : "The ultimate AI discovery platform";
    const logoUrl =
      (loaded && typeof loaded.logo === "string" && loaded.logo) ||
      "https://images.unsplash.com/photo-1673852528751-2ea89104fcce?q=80&w=200&auto=format&fit=crop";
    const futurestackScore =
      typeof (loaded as Record<string, unknown> | null)?.futurestack_score === "number"
        ? ((loaded as Record<string, unknown>).futurestack_score as number)
        : 8.5;
    const avgRating = loaded ? getRating(loaded) || 4.5 : 4.5;
    const reviewCount = loaded ? getReviewCount(loaded) || 0 : 0;
    const pricingType = loaded ? getPricingLabel(loaded) : "Freemium";

    return new ImageResponse(
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          backgroundColor: "#0f172a",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "white", borderRadius: "10px", padding: "6px 14px", display: "flex", alignItems: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://getdiscova.com/discova-logo.png"
                alt="Discova"
                width={130}
                height={44}
                style={{ height: "36px", width: "auto", objectFit: "contain" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <img src={logoUrl} width={120} height={120} style={{ borderRadius: "24px" }} alt="" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: "64px",
                  fontWeight: 900,
                  color: "#f1f5f9",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                {name}
              </div>
              <div style={{ fontSize: "32px", color: "#94a3b8", marginTop: "12px" }}>
                {tagline}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "24px" }}>
            <div
              style={{
                background: "#1e293b",
                borderRadius: "16px",
                padding: "24px 32px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: "48px", fontWeight: 900, color: "#ffffff" }}>
                {futurestackScore}
              </div>
              <div style={{ fontSize: "18px", color: "#64748b", marginTop: "4px" }}>
                DISCOVA Score
              </div>
            </div>

            <div
              style={{
                background: "#1e293b",
                borderRadius: "16px",
                padding: "24px 32px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: "48px", fontWeight: 700, color: "#fbbf24" }}>
                {avgRating.toFixed(1)} ★
              </div>
              <div style={{ fontSize: "18px", color: "#64748b", marginTop: "4px" }}>
                {reviewCount > 0 ? `${reviewCount} reviews` : "Community rated"}
              </div>
            </div>

            <div
              style={{
                background: "#1e293b",
                borderRadius: "16px",
                padding: "24px 32px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: "48px", fontWeight: 700, color: "#ffffff" }}>
                {pricingType}
              </div>
              <div style={{ fontSize: "18px", color: "#64748b", marginTop: "4px" }}>
                {fieldBool(loaded ?? {}, ["has_free", "freeTier"]) ? "Free tier available" : "Pricing model"}
              </div>
            </div>
          </div>
        </div>
      </div>,
      { width: 1200, height: 630 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(`Failed to generate image: ${message}`, { status: 500 });
  }
}
