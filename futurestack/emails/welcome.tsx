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

interface Props {
  firstName?: string;
  magicLink?: string;
}

export function WelcomeEmail({
  firstName = "Developer",
  magicLink = "https://getdiscova.com/login",
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to DISCOVA — Africa Discovers. Africa Decides.</Preview>
      <Body style={{ backgroundColor: "#0f172a", fontFamily: "sans-serif" }}>
        <Container
          style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}
        >
          <Section style={{ textAlign: "center", marginBottom: "40px" }}>
            <Text
              style={{
                color: "#4f46e5",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                margin: "0 0 8px 0",
              }}
            >
              🌍 Africa&apos;s Digital Discovery OS
            </Text>
            <Text
              style={{
                color: "#f1f5f9",
                fontSize: "28px",
                fontWeight: 900,
                margin: "8px 0",
                letterSpacing: "-0.02em",
              }}
            >
              Welcome to DISCOVA, {firstName}! 🚀
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
              }}
            >
              You&apos;ve joined Africa&apos;s most powerful digital discovery platform.
              Discover tools that actually work in Africa, build your perfect stack,
              and find opportunities designed for your reality.
            </Text>

            <Section style={{ textAlign: "center" }}>
              <Button
                href={magicLink}
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
                Start Discovering →
              </Button>
            </Section>
          </Section>

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
              DISCOVA — Africa Discovers. Africa Decides. • Unsubscribe instantly at any point.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;
