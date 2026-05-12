// React Email template for an experience certificate issuance.

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
  position: string;
  dashboardUrl: string;
  issuedBy: string;
}

export function ExperienceCertificateEmail({ employeeName, position, dashboardUrl, issuedBy }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your experience certificate has been issued</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.brand}>SOMION</Heading>

          <Heading as="h1" style={styles.title}>
            Your experience certificate is ready
          </Heading>

          <Text style={styles.text}>Hi {employeeName.split(" ")[0]},</Text>
          <Text style={styles.text}>
            Your experience certificate as <strong>{position}</strong> has been
            issued by {issuedBy} and is attached as a PDF.
          </Text>
          <Text style={styles.text}>
            You can also view, download, and print it any time from your dashboard.
          </Text>

          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Link href={dashboardUrl} style={styles.button}>
              View on my dashboard
            </Link>
          </Section>

          <Hr style={styles.divider} />
          <Text style={styles.footer}>
            Need a correction or another copy? Reach out to {issuedBy} or hr@somion.example.
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
  button: { backgroundColor: "#7c3aed", color: "#ffffff", padding: "10px 22px", borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: "none" },
  divider: { borderTop: "1px solid #e2e8f0", margin: "24px 0 12px" },
  footer: { fontSize: 12, color: "#94a3b8", margin: 0 },
};
