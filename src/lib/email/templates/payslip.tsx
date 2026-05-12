// React Email template for the payslip notification. The PDF itself is
// attached separately; this is the friendly HTML body.

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface Props {
  employeeName: string;
  periodLabel: string;
  netTotal: string;            // already formatted, e.g. "3,125 CHF"
  dashboardUrl: string;
}

export function PayslipEmail({ employeeName, periodLabel, netTotal, dashboardUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your {periodLabel} payslip is attached</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.brand}>SOMION</Heading>

          <Heading as="h1" style={styles.title}>
            Your payslip for {periodLabel} is ready
          </Heading>

          <Text style={styles.text}>Hi {employeeName.split(" ")[0]},</Text>
          <Text style={styles.text}>
            Your payslip for <strong>{periodLabel}</strong> has been issued. The
            full breakdown is attached as a PDF for your records.
          </Text>

          <Section style={styles.callout}>
            <Text style={styles.calloutLabel}>Net pay this period</Text>
            <Text style={styles.calloutValue}>{netTotal}</Text>
          </Section>

          <Text style={styles.text}>
            You can also view and print your full payment history any time
            from your dashboard.
          </Text>

          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Link href={dashboardUrl} style={styles.button}>
              Open my dashboard
            </Link>
          </Section>

          <Hr style={styles.divider} />
          <Text style={styles.footer}>
            Questions? Reply to this email or reach out to hr@somion.example.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: { backgroundColor: "#f8fafc", fontFamily: "Helvetica, Arial, sans-serif", padding: "24px 0" },
  container: { backgroundColor: "#ffffff", borderRadius: 12, padding: 32, maxWidth: 560, margin: "0 auto", border: "1px solid #e2e8f0" },
  brand: { fontSize: 16, letterSpacing: 2, color: "#7c3aed", margin: "0 0 12px" },
  title: { fontSize: 22, color: "#0f172a", margin: "0 0 16px" },
  text: { fontSize: 14, color: "#334155", lineHeight: 1.6, margin: "8px 0" },
  callout: { backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, margin: "16px 0", textAlign: "center" as const },
  calloutLabel: { fontSize: 11, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: 1, margin: 0 },
  calloutValue: { fontSize: 24, color: "#7c3aed", fontWeight: 700, margin: "4px 0 0" },
  button: { backgroundColor: "#7c3aed", color: "#ffffff", padding: "10px 22px", borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: "none" },
  divider: { borderTop: "1px solid #e2e8f0", margin: "24px 0 12px" },
  footer: { fontSize: 12, color: "#94a3b8", margin: 0 },
};
