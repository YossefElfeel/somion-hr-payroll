import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { db } from "@/lib/domain/store";
import { loadStore } from "@/lib/domain/persistence";
import { AddEmployeeButton } from "@/components/employee/add-employee-button";

export default async function EmployeesPage() {
  await loadStore();
  const employees = db.listEmployees();

  return (
    <AppShell title="Employees">
      <div className="mx-auto w-full px-4 py-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Employees
            </h1>
            <p className="text-xs text-slate-500">
              Open a profile to review payroll history, issue evaluations, or
              send an HR letter.
            </p>
          </div>
          <AddEmployeeButton />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Job title</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/employees/${e.id}`}
                      className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
                    >
                      {e.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {e.jobTitle ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">{e.department}</td>
                  <td className="px-4 py-2.5 text-slate-500">{e.email}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {e.status ?? "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/employees/${e.id}`}
                      className="text-xs font-medium text-brand-700 hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
