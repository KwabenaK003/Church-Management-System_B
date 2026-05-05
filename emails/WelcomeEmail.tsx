import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";

interface WelcomeEmailProps {
  firstName: string;
}

export default function WelcomeEmail({ firstName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to the church family</Preview>
      <Body style={{ backgroundColor: "#F8FAFC", fontFamily: "Inter, system-ui, sans-serif" }}>
        <Section style={{ margin: "0 auto", padding: "48px 0" }}>
          <Container style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "24px", padding: "32px" }}>
            <Text style={{ fontSize: "18px", fontWeight: 600, color: "#0F172A" }}>Welcome, {firstName}!</Text>
            <Text style={{ fontSize: "14px", color: "#64748B", lineHeight: "1.5" }}>
              Thank you for joining our community. We are excited to help you grow spiritually and serve alongside you.
            </Text>
            <Button
              style={{
                width: "100%",
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                borderRadius: "12px",
                fontWeight: 600,
                marginTop: "24px",
              }}
              href="https://your-church-domain.org"
            >
              Visit the portal
            </Button>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}
