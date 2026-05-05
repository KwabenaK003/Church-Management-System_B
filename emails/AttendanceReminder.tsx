import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";

interface AttendanceReminderProps {
  serviceName: string;
  serviceDate: string;
}

export default function AttendanceReminder({ serviceName, serviceDate }: AttendanceReminderProps) {
  return (
    <Html>
      <Head />
      <Preview>Reminder for upcoming service</Preview>
      <Body style={{ backgroundColor: "#F8FAFC", fontFamily: "Inter, system-ui, sans-serif" }}>
        <Section style={{ padding: "48px 0" }}>
          <Container style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "24px", padding: "32px" }}>
            <Text style={{ fontSize: "18px", fontWeight: 600, color: "#0F172A" }}>{serviceName}</Text>
            <Text style={{ color: "#64748B", fontSize: "14px", marginTop: "12px" }}>
              We're looking forward to welcoming you on {serviceDate}.
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
              href="https://your-church-domain.org/services"
            >
              View service details
            </Button>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}
