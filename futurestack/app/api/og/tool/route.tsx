import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    // Simulate caching getToolBySlugCached since actual query is abstracted
    const tool = {
      name:
        slug
          ?.split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ") || "DISCOVA Tool",
      tagline: "The ultimate AI discovery platform",
      logo_url:
        "https://images.unsplash.com/photo-1673852528751-2ea89104fcce?q=80&w=200&auto=format&fit=crop",
      futurestack_score: 9.2,
      avg_rating: 4.8,
      review_count: 124,
      pricing_type: "Freemium",
    };

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
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#94a3b8" }}
            >
              DISCOVA
            </div>
          </div>

          {/* Tool info */}
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <img
              src={tool.logo_url}
              width={120}
              height={120}
              style={{ borderRadius: "24px" }}
              alt=""
            />
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
                {tool.name}
              </div>
              <div
                style={{
                  fontSize: "32px",
                  color: "#94a3b8",
                  marginTop: "12px",
                }}
              >
                {tool.tagline}
              </div>
            </div>
          </div>

          {/* Score + category */}
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
              <div
                style={{ fontSize: "48px", fontWeight: 900, color: "#white" }}
              >
                {tool.futurestack_score}
              </div>
              <div
                style={{ fontSize: "18px", color: "#64748b", marginTop: "4px" }}
              >
                DISCOVA Score™
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
              <div
                style={{ fontSize: "48px", fontWeight: 700, color: "#fbbf24" }}
              >
                {tool.avg_rating} ★
              </div>
              <div
                style={{ fontSize: "18px", color: "#64748b", marginTop: "4px" }}
              >
                {tool.review_count} reviews
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
              <div
                style={{ fontSize: "48px", fontWeight: 700, color: "#white" }}
              >
                {tool.pricing_type}
              </div>
              <div
                style={{ fontSize: "18px", color: "#64748b", marginTop: "4px" }}
              >
                Pricing model
              </div>
            </div>
          </div>
        </div>
      </div>,
      { width: 1200, height: 630 },
    );
  } catch (e: any) {
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    });
  }
}
