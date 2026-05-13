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

export function UpgradeTrialEndingEmail() {
  return (
    <Html>
      <Head />
      <Preview>Your Pro Trial ends in 3 days!</Preview>
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
              Time flies when you're building. ⚡
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
              Your DISCOVA Pro trial drops back to the free tier in exactly
              72 hours. Don't lose access to unlimited stack builds, deep AI
              radar analytics, and our advanced comparison matrices.
            </Text>
            <Button
              href="https://futurestack.news/pricing"
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
              Secure My Pro Plan
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default UpgradeTrialEndingEmail;
