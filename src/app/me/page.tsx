import { cookies } from "next/headers";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { db } from "@/lib/domain/store";
import { loadStore } from "@/lib/domain/persistence";
import { computeTotals } from "@/lib/domain/totals";
import { MyPayslips } from "@/components/me/my-payslips";
import { MyEvaluations } from "@/components/me/my-evaluations";
import { MyDocuments } from "@/components/me/my-documents";

export default async function MePage() {
  await loadStore();
  const cookieStore = await cookies();
  const employeeId = cookieStore.get("somion.employeeId")?.value;
  const employee = employeeId ? db.getEmployee(employeeId) : null;

  if (!employee) {
    return (
      <AppShell title="My Dashboard">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h1 className="text-base font-semibold text-slate-900">
              No employee selected
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Use the role switcher in the top right to switch to
              <strong> Employee</strong> and pick which employee profile to
              view.
            </p>
            <Link
              href="/employees"
              className="mt-4 inline-flex items-center rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Browse employees instead
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const paidRows = db.listPaidRunItemsForEmployee(employee.id);
  const allBonuses = db.listAllBonusesForEmployee(employee.id);
  const allDeductions = db.listAllDeductionsForEmployee(employee.id);

  // Pre-compute net per row so the client widget doesn't need to aggregate.
  const netByRunId: Record<string, number> = {};
  for (const { run } of paidRows) {
    const runBonuses = allBonuses.filter((b) => b.runId === run.id);
    const runDeductions = allDeductions.filter((d) => d.runId === run.id);
    netByRunId[run.id] = computeTotals(employee, runBonuses, runDeductions).total;
  }

  const evaluations = db.listEvaluationsForEmployee(employee.id);
  const documents = db.listIssuedDocumentsForEmployee(employee.id);

  return (
    <AppShell title="My Dashboard">
      <div className="mx-auto w-full max-w-5xl px-4 py-4">
        <div className="mb-4">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Welcome back, {employee.name.split(" ")[0]}
          </h1>
          <p className="text-xs text-slate-500">
            Payslips, evaluations, and HR letters issued to you. Open any PDF
            in a new tab to print.
          </p>
        </div>

        <div className="space-y-4">
          <MyPayslips
            employeeId={employee.id}
            paidRows={paidRows}
            netByRunId={netByRunId}
          />
          <MyEvaluations evaluations={evaluations} />
          <MyDocuments documents={documents} />
        </div>
      </div>
    </AppShell>
  );
}
