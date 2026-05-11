import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Link,
} from "@react-email/components";

interface RadarItem {
  id: string | number;
  category: string;
  tool: { name: string };
  ai_summary: string;
}

interface Article {
  slug: string;
  title: string;
  excerpt: string;
}

interface Props {
  tools?: any[];
  radarItems: RadarItem[];
  topArticle: Article;
  weekNumber: number;
}

export function WeeklyDigestEmail({
  radarItems = [],
  topArticle = { slug: "welcome", title: "Top Story", excerpt: "..." },
  weekNumber = 28,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`Your weekly AI tool intelligence digest — Week ${weekNumber}`}</Preview>
      <Body style={{ backgroundColor: "#0f172a", fontFamily: "sans-serif" }}>
        <Container
          style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}
        >
          {/* Header */}
          <Section style={{ textAlign: "center", marginBottom: "40px" }}>
            <Text
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Week {weekNumber} · FutureStack News
            </Text>
            <Text
              style={{
                color: "#f1f5f9",
                fontSize: "28px",
                fontWeight: 900,
                margin: "8px 0",
              }}
            >
              Your AI Tool Radar
            </Text>
          </Section>

          {/* Top Article */}
          <Section
            style={{
              marginBottom: "32px",
              background: "#1e293b",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <Text
              style={{
                color: "#3b82f6",
                fontSize: "11px",
                textTransform: "uppercase",
                margin: "0 0 12px 0",
                fontWeight: "bold",
              }}
            >
              Top Story This Week
            </Text>
            <Text
              style={{
                color: "#f1f5f9",
                fontSize: "20px",
                fontWeight: 700,
                margin: "0 0 8px 0",
              }}
            >
              {topArticle.title}
            </Text>
            <Text
              style={{
                color: "#94a3b8",
                margin: "0 0 24px 0",
                lineHeight: "1.5",
              }}
            >
              {topArticle.excerpt}
            </Text>
            <Button
              href={`https://futurestack.news/news/${topArticle.slug}`}
              style={{
                background: "#3b82f6",
                color: "white",
                borderRadius: "8px",
                padding: "12px 24px",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              Read Full Story →
            </Button>
          </Section>

          {/* Radar Items */}
          {radarItems.map((item) => (
            <Section
              key={item.id}
              style={{
                marginBottom: "16px",
                padding: "16px",
                background: "#1e293b",
                borderRadius: "12px",
              }}
            >
              <Text style={{ color: "#f1f5f9", margin: 0, lineHeight: "1.5" }}>
                {item.category === "rising_star"
                  ? "🌟 "
                  : item.category === "underrated_gem"
                    ? "💎 "
                    : "🔥 "}
                <strong>{item.tool.name}</strong> — {item.ai_summary}
              </Text>
            </Section>
          ))}

          {/* CTA */}
          <Section style={{ textAlign: "center", marginTop: "40px" }}>
            <Button
              href="https://futurestack.news/radar"
              style={{
                background: "#3b82f6",
                color: "white",
                borderRadius: "8px",
                padding: "12px 24px",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              View Full Radar →
            </Button>
          </Section>

          {/* Footer */}
          <Section
            style={{
              borderTop: "1px solid #334155",
              marginTop: "40px",
              paddingTop: "24px",
            }}
          >
            <Text
              style={{
                color: "#475569",
                fontSize: "12px",
                textAlign: "center",
                margin: "0",
              }}
            >
              You're receiving this because you subscribed to FutureStack News.
            </Text>
            <Text
              style={{
                color: "#475569",
                fontSize: "12px",
                textAlign: "center",
                margin: "8px 0 0 0",
              }}
            >
              <Link
                href="{{unsubscribe_url}}"
                style={{ color: "#475569", textDecoration: "underline" }}
              >
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default WeeklyDigestEmail;
