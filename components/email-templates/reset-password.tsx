import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ResetPasswordEmailProps {
  userFirstname?: string;
  resetPasswordLink?: string;
}

export const ResetPasswordEmail = ({
  userFirstname = "Admin",
  resetPasswordLink,
}: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your Skolastik password</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={brand}>
              SKOLA<span style={brandGold}>STIK</span>
            </Heading>
            <Text style={tagline}>School Solutions</Text>
          </Section>

          <Section style={content}>
            <Heading style={heading}>Password Reset Request</Heading>

            <Text style={text}>Hi {userFirstname},</Text>
            <Text style={text}>
              We received a request to reset the password for your Skolastik
              school admin account. Click the button below to set a new password:
            </Text>

            <Section style={{ textAlign: "center" as const, margin: "32px 0" }}>
              <Button style={button} href={resetPasswordLink}>
                Reset My Password
              </Button>
            </Section>

            <Text style={text}>
              This link will expire in <strong>1 hour</strong> for security reasons.
            </Text>

            <Text style={text}>
              If you did not request a password reset, you can safely ignore
              this email — your password will remain unchanged.
            </Text>

            <Text style={warningText}>
              For security, never share this link with anyone.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Skolastik School Solutions. All rights reserved.
            </Text>
            <Text style={footerText}>Uganda&apos;s #1 School Management Platform</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ResetPasswordEmail;

// ── Styles ────────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "#f0f4f8",
  padding: "40px 0",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  overflow: "hidden" as const,
  maxWidth: "520px",
  margin: "0 auto",
  border: "1px solid #e2e8f0",
};

const header = {
  backgroundColor: "#1e3a6e",
  padding: "28px 40px",
  textAlign: "center" as const,
};

const brand = {
  color: "#ffffff",
  fontSize: "26px",
  fontWeight: "800",
  letterSpacing: "2px",
  margin: "0",
};

const brandGold = {
  color: "#e8a020",
};

const tagline = {
  color: "rgba(255,255,255,0.6)",
  fontSize: "11px",
  letterSpacing: "3px",
  textTransform: "uppercase" as const,
  margin: "4px 0 0",
};

const content = {
  padding: "36px 40px 24px",
};

const heading = {
  color: "#1e3a6e",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 20px",
};

const text = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const warningText = {
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "16px 0 0",
};

const button = {
  backgroundColor: "#1e3a6e",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const divider = {
  borderColor: "#e2e8f0",
  margin: "0 40px",
};

const footer = {
  padding: "20px 40px 28px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0 0 4px",
};
