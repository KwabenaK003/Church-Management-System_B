import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";

interface VisitorFollowUpProps {
  firstName: string;
}

export default function VisitorFollowUp({ firstName }: VisitorFollowUpProps) {
  return (
    <Html>
      <Head />
      <Preview>Thank you for visiting</Preview>
      <Body style={{ backgroundColor: "#F8FAFC", fontFamily: "Inter, system-ui, sans-serif" }}>
        <Section style={{ padding: "48px 0" }}>
          <Container style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "24px", padding: "32px" }}>
            <Text style={{ fontSize: "18px", fontWeight: 600, color: "#0F172A" }}>Hi {firstName},</Text>
            <Text style={{ color: "#64748B", fontSize: "14px", marginTop: "12px" }}>
              Thank you for joining us recently. We would love to connect—reply to this email or visit us at the next service.
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
              href="https://your-church-domain.org/connect"
            >
              Schedule a follow-up
            </Button>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}
