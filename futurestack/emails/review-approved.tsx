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

export function ReviewApprovedEmail({
  toolName = "ChatGPT",
}: {
  toolName?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Your review for {toolName} is live!</Preview>
      <Body style={{ backgroundColor: "#0f172a", fontFamily: "sans-serif" }}>
        <Container
          style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}
        >
          <Section style={{ textAlign: "center", marginBottom: "40px" }}>
            <Text
              style={{
                color: "#10b981",
                fontSize: "28px",
                fontWeight: 900,
                margin: "8px 0",
              }}
            >
              Review Approved! ✅
            </Text>
          </Section>
          <Section
            style={{
              marginBottom: "32px",
              background: "#1e293b",
              borderRadius: "12px",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                color: "#94a3b8",
                margin: "0 0 24px 0",
                lineHeight: "1.6",
                fontSize: "16px",
              }}
            >
              You officially received your "Verified Reviewer" badge on your
              profile. Your thoughts on {toolName} are now public and driving
              organic curation for over 15,000 developers.
            </Text>
            <Button
              href="https://getdiscova.com/dashboard"
              style={{
                background: "#10b981",
                color: "white",
                borderRadius: "8px",
                padding: "14px 28px",
                fontWeight: "bold",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              View My Profile
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ReviewApprovedEmail;
