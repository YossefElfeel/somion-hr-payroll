// Payslip PDF — generated on-demand from a RunItem + its run + the employee's
// bonuses/deductions for that run. No binary storage; the PDF is derived data.

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { computeTotals } from "@/lib/domain/totals";
import type {
  Bonus,
  Deduction,
  Employee,
  PayrollRun,
  RunItem,
} from "@/lib/domain/types";
import { pdfStyles as s, formatCHF, formatDate } from "./styles";

interface Props {
  employee: Employee;
  run: PayrollRun;
  item: RunItem;
  bonuses: Bonus[];
  deductions: Deduction[];
}

export function PayslipDocument({ employee, run, item, bonuses, deductions }: Props) {
  const totals = computeTotals(employee, bonuses, deductions);
  const manual = deductions.filter((d) => d.source === "MANUAL");
  const loan = deductions.filter((d) => d.source !== "MANUAL");

  return (
    <Document
      title={`Payslip — ${run.periodLabel} — ${employee.name}`}
      author="Somion HR"
      subject={`Payslip for ${employee.name} (${run.periodLabel})`}
    >
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>SOMION</Text>
          <View style={s.metaRow}>
            <Text>Payslip · {run.periodLabel}</Text>
            <Text>Issued {formatDate(item.paidAt ?? new Date().toISOString())}</Text>
          </View>
        </View>

        <Text style={s.h1}>{employee.name}</Text>
        <Text style={{ color: "#475569", marginBottom: 6 }}>
          {employee.jobTitle ?? employee.department} · ID {employee.id}
        </Text>

        <Text style={s.h2}>Salary breakdown</Text>

        <View style={s.row}>
          <Text style={s.label}>Basic salary</Text>
          <Text style={s.value}>{formatCHF(totals.basicSalary)}</Text>
        </View>

        {bonuses.length > 0 && (
          <>
            <Text style={[s.h2, { marginTop: 12 }]}>
              + Bonuses ({bonuses.length})
            </Text>
            {bonuses.map((b) => (
              <View key={b.id} style={s.row}>
                <Text style={s.label}>{b.reason || "Bonus"}</Text>
                <Text style={{ color: "#15803d" }}>+{formatCHF(b.amount)}</Text>
              </View>
            ))}
          </>
        )}

        {manual.length > 0 && (
          <>
            <Text style={[s.h2, { marginTop: 12 }]}>
              − Deductions ({manual.length})
            </Text>
            {manual.map((d) => (
              <View key={d.id} style={s.row}>
                <Text style={s.label}>{d.reason || "Deduction"}</Text>
                <Text style={{ color: "#b91c1c" }}>-{formatCHF(d.amount)}</Text>
              </View>
            ))}
          </>
        )}

        {loan.length > 0 && (
          <>
            <Text style={[s.h2, { marginTop: 12 }]}>− Loan ({loan.length})</Text>
            {loan.map((d) => (
              <View key={d.id} style={s.row}>
                <Text style={s.label}>{d.reason || "Loan installment"}</Text>
                <Text style={{ color: "#b91c1c" }}>-{formatCHF(d.amount)}</Text>
              </View>
            ))}
          </>
        )}

        <View style={s.net}>
          <Text style={s.netLabel}>Net pay</Text>
          <Text style={s.netValue}>{formatCHF(totals.total)}</Text>
        </View>

        <Text style={s.h2}>Bank details</Text>
        <View style={s.row}>
          <Text style={s.label}>Bank</Text>
          <Text style={s.value}>{employee.bank.bankName}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Account name</Text>
          <Text style={s.value}>{employee.bank.accountName}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>IBAN</Text>
          <Text style={s.value}>{employee.bank.iban}</Text>
        </View>

        <Text style={s.footer}>
          This payslip was issued automatically by Somion HR. For questions about
          your pay, contact hr@somion.example.
        </Text>
      </Page>
    </Document>
  );
}
