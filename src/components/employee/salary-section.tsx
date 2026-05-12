"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Employee, SalaryUpgrade } from "@/lib/domain/types";
import { useCurrentRole } from "@/components/shell/role-switcher";
import { EmployeeSection, InfoGrid } from "./section";
import { AddSalaryUpgradeModal } from "./add-salary-upgrade-modal";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SalarySection({
  employee,
  upgrades,
}: {
  employee: Employee;
  upgrades: SalaryUpgrade[];
}) {
  const role = useCurrentRole();
  const [open, setOpen] = useState(false);
  const canEdit = role === "HR" || role === "ADMIN";

  return (
    <>
      <EmployeeSection
        title="Salary Information"
        action={
          canEdit ? (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus size={12} /> Salary upgrade
            </button>
          ) : null
        }
      >
        <InfoGrid
          items={[
            { label: "Base Salary", value: `${employee.basicSalary.toLocaleString()}` },
            { label: "Currency", value: "EGP" },
            { label: "Total Salary", value: `${employee.basicSalary.toLocaleString()}` },
            { label: "Payment Method", value: "Bank Account" },
          ]}
        />

        {upgrades.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Salary Upgrade History
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Salary</th>
                    <th className="px-3 py-2">Upgrade Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {upgrades.map((u) => (
                    <tr key={u.id}>
                      <td className="px-3 py-2 text-slate-700">{formatDate(u.date)}</td>
                      <td className="px-3 py-2 text-slate-800">
                        {u.newSalary.toLocaleString()} CHF
                      </td>
                      <td
                        className={`px-3 py-2 font-medium ${
                          u.percentage >= 0 ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {u.percentage >= 0 ? "+" : ""}
                        {u.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </EmployeeSection>

      <AddSalaryUpgradeModal
        open={open}
        onClose={() => setOpen(false)}
        employeeId={employee.id}
        currentSalary={employee.basicSalary}
      />
    </>
  );
}
