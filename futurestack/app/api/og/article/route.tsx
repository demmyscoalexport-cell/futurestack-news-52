import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug") || "unknown";

    // Fetch from Supabase
    const supabase = await createClient();
    const { data: article } = await supabase
      .from("articles")
      .select(
        "title, meta_description, hero_image, published_at, profiles(full_name, avatar_url), article_categories(name)",
      )
      .eq("slug", slug)
      .single();

    const title = article?.title || "AI Intelligence Report";
    const excerpt =
      article?.meta_description || "The latest from DISCOVA — Africa's discovery platform";
    const category = (article?.article_categories as any)?.name || "Analysis";
    const authorName =
      (article?.profiles as any)?.full_name || "DISCOVA Team";
    const date = article?.published_at
      ? new Date(article.published_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

    return new ImageResponse(
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          padding: "64px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Decorative glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Top: category badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                background: "#4f46e5",
                color: "white",
                fontSize: "14px",
                fontWeight: 800,
                padding: "6px 16px",
                borderRadius: "999px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {category}
            </div>
            <div style={{ color: "#64748b", fontSize: "14px" }}>{date}</div>
          </div>

          {/* Middle: Title + excerpt */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
              padding: "32px 0",
            }}
          >
            <div
              style={{
                fontSize: "52px",
                fontWeight: 900,
                color: "#f1f5f9",
                lineHeight: 1.15,
                marginBottom: "20px",
                letterSpacing: "-0.02em",
                maxWidth: "900px",
              }}
            >
              {title.length > 72 ? title.slice(0, 72) + "…" : title}
            </div>
            <div
              style={{
                fontSize: "22px",
                color: "#94a3b8",
                lineHeight: 1.5,
                maxWidth: "800px",
              }}
            >
              {excerpt.length > 120 ? excerpt.slice(0, 120) + "…" : excerpt}
            </div>
          </div>

          {/* Bottom: Author + branding */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "#334155",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "18px",
                }}
              >
                {authorName.charAt(0)}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    color: "#f1f5f9",
                    fontWeight: 700,
                    fontSize: "16px",
                  }}
                >
                  {authorName}
                </div>
                <div style={{ color: "#64748b", fontSize: "13px" }}>
                  DISCOVA
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#4f46e5",
                  display: "flex",
                }}
              />
              <div
                style={{ color: "#94a3b8", fontSize: "16px", fontWeight: 700 }}
              >
                getdiscova.com
              </div>
            </div>
          </div>
        </div>
      </div>,
      { width: 1200, height: 630 },
    );
  } catch (e: any) {
    return new Response(`OG Error: ${e.message}`, { status: 500 });
  }
}
