// HR Letter PDF — generic letter format used for visa applications, bank
// loans, embassy submissions, and similar one-off requests.

import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { Employee, IssuedDocument, HRLetterPayload } from "@/lib/domain/types";
import { pdfStyles as s, formatDate } from "./styles";

interface Props {
  doc: IssuedDocument;
  employee: Employee;
}

export function HRLetterDocument({ doc, employee }: Props) {
  const payload = doc.payload as HRLetterPayload;

  return (
    <Document title={`HR Letter — ${employee.name}`} author="Somion HR">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>SOMION</Text>
          <View style={s.metaRow}>
            <Text>HR Letter</Text>
            <Text>{formatDate(doc.issuedAt)}</Text>
          </View>
        </View>

        <Text style={{ color: "#475569", marginBottom: 2 }}>Addressed to</Text>
        <Text style={[s.h1, { marginBottom: 12 }]}>{payload.addressedTo}</Text>

        <Text style={{ color: "#475569" }}>Subject</Text>
        <Text style={[s.h2, { marginTop: 2, marginBottom: 10 }]}>
          {doc.subject || payload.purpose}
        </Text>

        <Text style={s.paragraph}>
          Dear {payload.addressedTo},
        </Text>

        <Text style={s.paragraph}>
          This letter is issued on behalf of{" "}
          <Text style={s.badge}>{employee.name}</Text>
          {employee.jobTitle ? (
            <> ({employee.jobTitle})</>
          ) : null}
          , who is currently employed at Somion, in connection with the
          following matter: <Text style={s.badge}>{payload.purpose}</Text>.
        </Text>

        <Text style={s.paragraph}>{payload.body}</Text>

        <Text style={s.paragraph}>
          Should you require any further information or verification, please
          contact us at hr@somion.example.
        </Text>

        <Text style={s.paragraph}>Sincerely,</Text>

        <View style={s.signatureBlock}>
          <Text style={s.signatureLine}>
            {doc.issuedBy} · Somion HR · {formatDate(doc.issuedAt)}
          </Text>
        </View>

        <Text style={s.footer}>
          Reference: {doc.id}. This letter is issued upon the employee&apos;s
          request.
        </Text>
      </Page>
    </Document>
  );
}
