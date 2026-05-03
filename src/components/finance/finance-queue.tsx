"use client";

import { useTransition } from "react";
import { CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { RunStateBadge } from "@/components/payroll/run-state-badge";
import { StatusBadge } from "@/components/payroll/status-badge";
import { markPaid } from "@/lib/actions";
import { computeTotals, formatCHF } from "@/lib/domain/totals";
import type {
  Bonus,
  Deduction,
  Employee,
  PayrollRun,
  RunItem,
} from "@/lib/domain/types";

interface Group {
  run: PayrollRun;
  items: { it: RunItem; emp: Employee; bonuses: Bonus[]; deductions: Deduction[] }[];
}

export function FinanceQueue({ groups }: { groups: Group[] }) {
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <RunGroup key={g.run.id} group={g} />
      ))}
    </div>
  );
}

function RunGroup({ group }: { group: Group }) {
  const [pending, startTransition] = useTransition();

  const totalToPay = group.items
    .filter((x) => x.it.status === "IN_FINANCE_QUEUE")
    .reduce((s, x) => s + computeTotals(x.emp, x.bonuses, x.deductions).total, 0);

  function exportCsv() {
    const rows = group.items.map((x) => {
      const t = computeTotals(x.emp, x.bonuses, x.deductions);
      return {
        name: x.emp.name,
        iban: x.emp.bank.iban,
        amount: t.total,
        status: x.it.status,
      };
    });
    const csv = [
      "Name,IBAN,Amount,Status",
      ...rows.map((r) => `${r.name},${r.iban},${r.amount},${r.status}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${group.run.periodKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              {group.run.periodLabel}
            </h3>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">{group.run.frequency}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
            <RunStateBadge state={group.run.state} />
            <span>
              {group.items.length} payments · {formatCHF(totalToPay)} pending
            </span>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={exportCsv}>
          <Download size={14} /> Export bank file
        </Button>
      </CardHeader>
      <CardBody className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Employee</th>
              <th className="px-4 py-3 text-left font-medium">IBAN</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {group.items.map(({ it, emp, bonuses, deductions }) => {
              const t = computeTotals(emp, bonuses, deductions);
              return (
                <tr key={it.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{emp.name}</div>
                    <div className="text-xs text-slate-500">{emp.department}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    {emp.bank.iban}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {formatCHF(t.total)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={it.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {it.status === "IN_FINANCE_QUEUE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await markPaid(group.run.id, emp.id);
                            })
                          }
                        >
                          <CheckCircle2 size={14} /> Mark paid
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
