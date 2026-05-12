// React Email template for evaluation issuance. Includes a mini-scorecard
// inline so the employee gets the gist without opening the PDF.

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
import { EVALUATION_CATEGORIES, type Evaluation } from "@/lib/domain/types";

interface Props {
  employeeName: string;
  evaluation: Evaluation;
  dashboardUrl: string;
}

function bar(score: number): string {
  return "█".repeat(score) + "░".repeat(Math.max(0, 5 - score));
}

export function EvaluationEmail({ employeeName, evaluation, dashboardUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your {evaluation.periodLabel} evaluation is ready</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.brand}>SOMION</Heading>

          <Heading as="h1" style={styles.title}>
            Your {evaluation.periodLabel} performance evaluation is ready
          </Heading>

          <Text style={styles.text}>Hi {employeeName.split(" ")[0]},</Text>
          <Text style={styles.text}>
            {evaluation.evaluatedBy} has completed your performance evaluation
            for <strong>{evaluation.periodLabel}</strong>. The full report is
            attached as a PDF. A quick summary is below.
          </Text>

          <Section style={styles.callout}>
            <Text style={styles.calloutLabel}>Overall score</Text>
            <Text style={styles.calloutValue}>{evaluation.overall.toFixed(1)} / 5</Text>
          </Section>

          <Section style={{ margin: "12px 0 20px" }}>
            {EVALUATION_CATEGORIES.map((cat) => (
              <Section key={cat} style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>{cat}</Text>
                <Text style={styles.scoreBar}>{bar(evaluation.scores[cat])}</Text>
                <Text style={styles.scoreValue}>{evaluation.scores[cat]} / 5</Text>
              </Section>
            ))}
          </Section>

          <Text style={styles.text}>
            You can view the full evaluation, including strengths, areas to
            improve, and goals for next period, on your dashboard.
          </Text>

          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Link href={dashboardUrl} style={styles.button}>
              View on my dashboard
            </Link>
          </Section>

          <Hr style={styles.divider} />
          <Text style={styles.footer}>
            Questions about your evaluation? Reach out to {evaluation.evaluatedBy} or hr@somion.example.
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
  calloutValue: { fontSize: 26, color: "#7c3aed", fontWeight: 700, margin: "4px 0 0" },
  scoreRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" },
  scoreLabel: { fontSize: 13, color: "#334155", margin: 0, width: "33%" },
  scoreBar: { fontSize: 13, color: "#7c3aed", margin: 0, letterSpacing: 2, fontFamily: "monospace" },
  scoreValue: { fontSize: 13, color: "#0f172a", margin: 0, fontWeight: 600 },
  button: { backgroundColor: "#7c3aed", color: "#ffffff", padding: "10px 22px", borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: "none" },
  divider: { borderTop: "1px solid #e2e8f0", margin: "24px 0 12px" },
  footer: { fontSize: 12, color: "#94a3b8", margin: 0 },
};
