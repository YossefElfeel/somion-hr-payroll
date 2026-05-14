// Experience Certificate PDF.
// Formal letter format with a computed tenure label, a reason-tailored
// closing line, and a reference number in the footer. Body uses inline
// bold for the employee's name / dates instead of brand-coloured badges
// so the doc reads like a normal HR letter when printed.

import { Document, Page, Text, View } from "@react-pdf/renderer";
import type {
  Employee,
  ExperienceCertificatePayload,
  IssuedDocument,
} from "@/lib/domain/types";
import { pdfStyles as s, formatDate } from "./styles";

interface Props {
  doc: IssuedDocument;
  employee: Employee;
}

// "1 year, 3 months" / "10 months" / "3 years". Truncates to year+month
// granularity — anything finer is noise on a formal HR letter.
function formatTenure(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) return "";
  let months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());
  if (end.getUTCDate() < start.getUTCDate()) months -= 1;
  months = Math.max(0, months);
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years === 1 ? "" : "s"}`);
  if (remMonths > 0) parts.push(`${remMonths} month${remMonths === 1 ? "" : "s"}`);
  if (parts.length === 0) return "less than a month";
  return parts.join(", ");
}

// One sentence describing why the cert was issued. Tailored per reason so
// the letter doesn't feel generic. Falls back to a neutral "official
// purposes" line for "Other"-style free text.
function closingForReason(reason: string, firstName: string): string {
  const r = reason.toLowerCase();
  if (r.includes("visa")) {
    return `This certificate is issued at ${firstName}'s request in connection with a visa application and may be presented to the relevant authorities.`;
  }
  if (r.includes("employer") || r.includes("job")) {
    return `This certificate is issued at ${firstName}'s request as a reference for prospective employers.`;
  }
  if (r.includes("bank") || r.includes("financial") || r.includes("loan") || r.includes("mortgage")) {
    return `This certificate is issued at ${firstName}'s request in connection with a financial or banking application.`;
  }
  if (r.includes("embassy") || r.includes("consulate")) {
    return `This certificate is issued at ${firstName}'s request for submission to an embassy or consulate.`;
  }
  if (r.includes("general")) {
    return `This certificate is issued at ${firstName}'s request and may be used for any official purpose.`;
  }
  return `This certificate is issued at ${firstName}'s request for the purposes of: ${reason}.`;
}

export function ExperienceCertificateDocument({ doc, employee }: Props) {
  const payload = doc.payload as ExperienceCertificatePayload;
  const firstName = employee.name.split(" ")[0];
  const effectiveEnd = payload.stillEmployed
    ? doc.issuedAt
    : payload.endDate ?? doc.issuedAt;
  const tenure = formatTenure(payload.startDate, effectiveEnd);

  // "from 02 Jan 2024 to 15 Oct 2026" / "since 02 Jan 2024"
  const datePhrase = payload.stillEmployed
    ? `since ${formatDate(payload.startDate)}`
    : `from ${formatDate(payload.startDate)} to ${formatDate(payload.endDate)}`;

  return (
    <Document
      title={`Experience Certificate — ${employee.name}`}
      author="Somion HR"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>SOMION</Text>
          <View style={s.metaRow}>
            <Text>Experience Certificate</Text>
            <Text>{formatDate(doc.issuedAt)}</Text>
          </View>
        </View>

        <Text style={[s.h1, { textAlign: "center", marginTop: 8, marginBottom: 4 }]}>
          TO WHOM IT MAY CONCERN
        </Text>
        {doc.referenceNumber && (
          <Text style={{ textAlign: "center", color: "#94a3b8", fontSize: 9, marginBottom: 18 }}>
            Reference: {doc.referenceNumber}
          </Text>
        )}

        <Text style={s.paragraph}>
          This is to certify that{" "}
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{employee.name}</Text>
          {" "}
          {payload.stillEmployed ? "is" : "was"} employed at Somion as a{" "}
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{payload.position}</Text>
          {" "}within the {employee.department} department,{" "}
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{datePhrase}</Text>
          {tenure ? ` (a total of ${tenure})` : ""}.
        </Text>

        <Text style={s.paragraph}>
          During this period, {firstName} demonstrated a strong work ethic and
          contributed meaningfully to the {employee.department.toLowerCase()}{" "}
          function at Somion. {firstName}&apos;s conduct and performance have been
          consistent with the company&apos;s expectations of {payload.position.toLowerCase()}s.
        </Text>

        {payload.remarks && (
          <>
            <Text style={s.h2}>Remarks</Text>
            <Text style={s.paragraph}>{payload.remarks}</Text>
          </>
        )}

        <Text style={s.paragraph}>{closingForReason(payload.reason, firstName)}</Text>

        <View style={s.signatureBlock}>
          <Text style={s.signatureLine}>
            {doc.issuedBy} · Somion HR · {formatDate(doc.issuedAt)}
          </Text>
        </View>

        <Text style={s.footer}>
          For verification, contact hr@somion.example with the reference{" "}
          {doc.referenceNumber ?? doc.id}.
        </Text>
      </Page>
    </Document>
  );
}
