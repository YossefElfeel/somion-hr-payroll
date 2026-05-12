// Experience Certificate PDF — letter format, addressed-to header,
// employment dates, optional remarks, signature block.

import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { Employee, IssuedDocument, ExperienceCertificatePayload } from "@/lib/domain/types";
import { pdfStyles as s, formatDate } from "./styles";

interface Props {
  doc: IssuedDocument;
  employee: Employee;
}

export function ExperienceCertificateDocument({ doc, employee }: Props) {
  const payload = doc.payload as ExperienceCertificatePayload;

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

        <Text style={[s.h1, { textAlign: "center", marginTop: 8, marginBottom: 18 }]}>
          TO WHOM IT MAY CONCERN
        </Text>

        <Text style={s.paragraph}>
          This is to certify that <Text style={s.badge}>{employee.name}</Text> was
          employed at Somion as a <Text style={s.badge}>{payload.position}</Text>{" "}
          from <Text style={s.badge}>{formatDate(payload.startDate)}</Text>
          {payload.endDate ? (
            <>
              {" "}to <Text style={s.badge}>{formatDate(payload.endDate)}</Text>.
            </>
          ) : (
            <> and is currently still employed with us.</>
          )}
        </Text>

        <Text style={s.paragraph}>
          During this period, {employee.name.split(" ")[0]} was an integral
          member of our team and contributed meaningfully to the company.
        </Text>

        {payload.remarks && (
          <>
            <Text style={s.h2}>Remarks</Text>
            <Text style={s.paragraph}>{payload.remarks}</Text>
          </>
        )}

        <Text style={s.paragraph}>
          This certificate is issued upon the employee&apos;s request and may be
          used for any official purpose.
        </Text>

        <View style={s.signatureBlock}>
          <Text style={s.signatureLine}>
            {doc.issuedBy} · Somion HR · {formatDate(doc.issuedAt)}
          </Text>
        </View>

        <Text style={s.footer}>
          For verification, contact hr@somion.example with the certificate
          reference {doc.id}.
        </Text>
      </Page>
    </Document>
  );
}
