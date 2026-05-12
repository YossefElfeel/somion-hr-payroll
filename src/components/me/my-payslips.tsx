"use client";

import { Download, Printer } from "lucide-react";
import type { PayrollRun, RunItem } from "@/lib/domain/types";

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  employeeId: string;
  paidRows: Array<{ item: RunItem; run: PayrollRun }>;
  netByRunId: Record<string, number>;
}

// Employee-facing payslip list. Both buttons open the same PDF route — the
// browser handles the actual print dialog when the PDF is open.
export function MyPayslips({ employeeId, paidRows, netByRunId }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">My Payslips</h2>
      </header>
      <div className="p-5">
        {paidRows.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
            You don&apos;t have any payslips yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-3 py-2">Paid on</th>
                  <th className="px-3 py-2">Period</th>
                  <th className="px-3 py-2">Net total</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paidRows.map(({ item, run }) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-slate-700">
                      {formatDate(item.paidAt)}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {run.periodLabel}
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      {(netByRunId[run.id] ?? 0).toLocaleString()} CHF
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <a
                          href={`/api/payslips/${run.id}/${employeeId}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Download size={12} /> View
                        </a>
                        <a
                          href={`/api/payslips/${run.id}/${employeeId}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Printer size={12} /> Print
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
