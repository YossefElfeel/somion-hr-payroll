// Evaluation PDF — multi-category scorecard, overall score, narrative fields.
// Stars are drawn as filled/empty unicode glyphs to keep the PDF font-agnostic.

import { Document, Page, Text, View } from "@react-pdf/renderer";
import {
  EVALUATION_CATEGORIES,
  type Employee,
  type Evaluation,
} from "@/lib/domain/types";
import { pdfStyles as s, formatDate, brand } from "./styles";

interface Props {
  evaluation: Evaluation;
  employee: Employee;
}

function stars(score: number): string {
  // 1..5 filled stars + the remainder empty. Helvetica supports these glyphs.
  return "★".repeat(score) + "☆".repeat(Math.max(0, 5 - score));
}

export function EvaluationDocument({ evaluation, employee }: Props) {
  return (
    <Document
      title={`Evaluation — ${evaluation.periodLabel} — ${employee.name}`}
      author="Somion HR"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>SOMION</Text>
          <View style={s.metaRow}>
            <Text>Performance Evaluation · {evaluation.periodLabel}</Text>
            <Text>{formatDate(evaluation.evaluatedAt)}</Text>
          </View>
        </View>

        <Text style={s.h1}>{employee.name}</Text>
        <Text style={{ color: brand.textMuted, marginBottom: 6 }}>
          {employee.jobTitle ?? employee.department} · ID {employee.id}
        </Text>

        <View
          style={{
            marginTop: 14,
            padding: 12,
            backgroundColor: brand.bgFaint,
            borderRadius: 4,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ fontSize: 9.5, color: brand.textMuted, textTransform: "uppercase" }}>
              Overall score
            </Text>
            <Text
              style={{
                fontSize: 26,
                fontFamily: "Helvetica-Bold",
                color: brand.primary,
                marginTop: 4,
              }}
            >
              {evaluation.overall.toFixed(1)}
              <Text style={{ fontSize: 12, color: brand.textMuted }}> / 5</Text>
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 9.5, color: brand.textMuted, textTransform: "uppercase" }}>
              Evaluator
            </Text>
            <Text style={{ fontSize: 12, marginTop: 4 }}>{evaluation.evaluatedBy}</Text>
          </View>
        </View>

        <Text style={s.h2}>Scorecard</Text>
        {EVALUATION_CATEGORIES.map((cat) => (
          <View key={cat} style={s.row}>
            <Text style={s.label}>{cat}</Text>
            <Text style={{ color: brand.primary, letterSpacing: 1.5 }}>
              {stars(evaluation.scores[cat])}{"  "}
              <Text style={{ color: brand.text }}>{evaluation.scores[cat]} / 5</Text>
            </Text>
          </View>
        ))}

        <Text style={s.h2}>Strengths</Text>
        <Text style={s.paragraph}>{evaluation.strengths || "—"}</Text>

        <Text style={s.h2}>Areas to improve</Text>
        <Text style={s.paragraph}>{evaluation.areasToImprove || "—"}</Text>

        {evaluation.goalsNextPeriod && (
          <>
            <Text style={s.h2}>Goals for next period</Text>
            <Text style={s.paragraph}>{evaluation.goalsNextPeriod}</Text>
          </>
        )}

        {evaluation.comments && (
          <>
            <Text style={s.h2}>Additional comments</Text>
            <Text style={s.paragraph}>{evaluation.comments}</Text>
          </>
        )}

        <View style={s.signatureBlock}>
          <Text style={s.signatureLine}>
            {evaluation.evaluatedBy} · Somion HR · {formatDate(evaluation.evaluatedAt)}
          </Text>
        </View>

        <Text style={s.footer}>
          This evaluation is confidential. Please contact HR if anything in this
          document needs correction.
        </Text>
      </Page>
    </Document>
  );
}
