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
  toolName?: string;
  updateTitle?: string;
  updateDescription?: string;
  slug?: string;
}

export function ToolUpdateEmail({
  toolName = "Cursor",
  updateTitle = "New GPT-4o Integration",
  updateDescription = "Cursor has successfully integrated GPT-4o natively into its codebase engine.",
  slug = "cursor",
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{toolName} just shipped a massive update!</Preview>
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
              {toolName} shipped a new update! 🚀
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
                color: "#3b82f6",
                fontSize: "11px",
                textTransform: "uppercase",
                margin: "0 0 12px 0",
                fontWeight: "bold",
              }}
            >
              Changelog Alert
            </Text>
            <Text
              style={{
                color: "#f1f5f9",
                fontSize: "20px",
                fontWeight: 700,
                margin: "0 0 8px 0",
              }}
            >
              {updateTitle}
            </Text>
            <Text
              style={{
                color: "#94a3b8",
                margin: "0 0 24px 0",
                lineHeight: "1.6",
                fontSize: "16px",
              }}
            >
              {updateDescription}
            </Text>

            <Section style={{ textAlign: "center" }}>
              <Button
                href={`https://futurestack.news/tools/${slug}`}
                style={{
                  background: "#4f46e5",
                  color: "white",
                  borderRadius: "8px",
                  padding: "14px 28px",
                  fontWeight: "bold",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                View Full Changelog
              </Button>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ToolUpdateEmail;
