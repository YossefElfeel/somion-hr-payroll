"use client";

import { useTransition } from "react";
import { Download, Send } from "lucide-react";
import type { PayrollRun, RunItem } from "@/lib/domain/types";
import { resendPayslipEmail } from "@/lib/actions";
import { EmployeeSection } from "./section";
import { EmailStatusBadge } from "./email-status-badge";

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  employeeId: string;
  paidRows: Array<{ item: RunItem; run: PayrollRun }>;
  // For each (runId), the precomputed net total — saves the section from
  // having to re-aggregate bonuses/deductions.
  netByRunId: Record<string, number>;
}

export function PayrollHistorySection({ employeeId, paidRows, netByRunId }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <EmployeeSection
      title="Payroll History"
      hint="Every payslip we've sent. Re-send the email or open the PDF in a new tab."
    >
      {paidRows.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
          No payments yet. When a payroll run is marked paid, a payslip will
          appear here automatically.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
              <tr>
                <th className="px-3 py-2">Paid on</th>
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2">Net total</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paidRows.map(({ item, run }) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 text-slate-700">
                    {formatDate(item.paidAt)}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{run.periodLabel}</td>
                  <td className="px-3 py-2 font-semibold text-slate-900">
                    {(netByRunId[run.id] ?? 0).toLocaleString()} CHF
                  </td>
                  <td className="px-3 py-2">
                    <EmailStatusBadge status={item.payslipEmailStatus} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <a
                        href={`/api/payslips/${run.id}/${employeeId}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Download size={12} /> View PDF
                      </a>
                      <button
                        onClick={() =>
                          startTransition(async () => {
                            await resendPayslipEmail(run.id, employeeId);
                          })
                        }
                        disabled={pending}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Send size={12} /> Resend
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </EmployeeSection>
  );
}
