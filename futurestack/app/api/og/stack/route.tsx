import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    const supabase = await createClient();
    const { data: stack } = await supabase
      .from("stacks")
      .select(
        `
        name, description,
        profiles(full_name),
        stack_tools(
          position,
          tools(name, logo, tool_scores(futurestack_score))
        )
      `,
      )
      .eq("id", id)
      .single();

    const name = stack?.name || "My AI Stack";
    const author = (stack?.profiles as any)?.full_name || "DISCOVA User";
    const tools = (stack?.stack_tools || [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((st: any) => st.tools)
      .filter(Boolean)
      .slice(0, 6);

    return new ImageResponse(
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)",
          padding: "60px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            width: "600px",
            height: "300px",
            background:
              "radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)",
            display: "flex",
            transform: "translateX(-50%)",
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
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  color: "#6366f1",
                  fontSize: "13px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "8px",
                }}
              >
                AI Tool Stack
              </div>
              <div
                style={{
                  color: "#f1f5f9",
                  fontSize: "48px",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  maxWidth: "700px",
                }}
              >
                {name}
              </div>
              <div
                style={{
                  color: "#64748b",
                  fontSize: "18px",
                  marginTop: "10px",
                }}
              >
                Built by {author}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <div
                style={{ color: "#94a3b8", fontSize: "14px", fontWeight: 700 }}
              >
                getdiscova.com
              </div>
            </div>
          </div>

          {/* Tool Logos Grid */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {tools.map((tool: any, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "16px",
                    background: "#1e293b",
                    border: "1px solid #334155",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6366f1",
                    fontSize: "28px",
                    fontWeight: 900,
                    overflow: "hidden",
                  }}
                >
                  {tool.logo ? (
                    <img
                      src={tool.logo}
                      width={80}
                      height={80}
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    tool.name.charAt(0)
                  )}
                </div>
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "12px",
                    fontWeight: 600,
                    maxWidth: "80px",
                    textAlign: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tool.name}
                </div>
              </div>
            ))}
            {tools.length === 0 && (
              <div
                style={{ color: "#475569", fontSize: "18px", display: "flex" }}
              >
                No tools added yet
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#6366f1",
                  display: "flex",
                }}
              />
              <div
                style={{ color: "#64748b", fontSize: "16px", fontWeight: 700 }}
              >
                DISCOVA
              </div>
            </div>
            <div
              style={{
                background: "#6366f1",
                color: "white",
                fontSize: "14px",
                fontWeight: 800,
                padding: "8px 20px",
                borderRadius: "999px",
                display: "flex",
              }}
            >
              {tools.length} tools in this stack
            </div>
          </div>
        </div>
      </div>,
      { width: 1200, height: 630 },
    );
  } catch (e: any) {
    return new Response(`Stack OG Error: ${e.message}`, { status: 500 });
  }
}
