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
} from "@react-email/components";

interface Props {
  comparisonTitle?: string;
  winnerName?: string;
  slugs?: string;
}

export function NewComparisonEmail({
  comparisonTitle = "Cursor vs Devin",
  winnerName = "Cursor",
  slugs = "cursor-vs-devin",
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Detailed breakdown: {comparisonTitle}</Preview>
      <Body style={{ backgroundColor: "#0f172a", fontFamily: "sans-serif" }}>
        <Container
          style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}
        >
          <Section style={{ textAlign: "center", marginBottom: "40px" }}>
            <Text
              style={{
                color: "#f1f5f9",
                fontSize: "28px",
                fontWeight: 900,
                margin: "8px 0",
              }}
            >
              New Comparison Alert
            </Text>
          </Section>

          <Section
            style={{
              marginBottom: "32px",
              background: "#1e293b",
              borderRadius: "12px",
              padding: "32px",
            }}
          >
            <Text
              style={{
                color: "#94a3b8",
                margin: "0 0 24px 0",
                lineHeight: "1.6",
                fontSize: "16px",
                textAlign: "center",
              }}
            >
              Our AI intelligence engine just finished simulating and comparing{" "}
              <strong style={{ color: "white" }}>{comparisonTitle}</strong>. The
              ultimate winner for your specific stack preferences was scored
              directly as{" "}
              <strong style={{ color: "white" }}>{winnerName}</strong>.
            </Text>

            <Section style={{ textAlign: "center" }}>
              <Button
                href={`https://futurestack.news/compare/${slugs}`}
                style={{
                  background: "#fbbf24",
                  color: "#1e293b",
                  borderRadius: "8px",
                  padding: "14px 28px",
                  fontWeight: "bold",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                See The Verdict
              </Button>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default NewComparisonEmail;
