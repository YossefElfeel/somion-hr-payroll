import { AppShell } from "@/components/shell/app-shell";
import { FinanceQueue } from "@/components/finance/finance-queue";
import { db } from "@/lib/domain/store";
import { loadStore } from "@/lib/domain/persistence";

export const dynamic = "force-dynamic";

export default async function FinanceQueuePage() {
  await loadStore();
  // Show every run that has at least one item Finance can act on (or has acted on).
  // With per-employee batches, a single run can be in this queue many times across days.
  const groups = db
    .listRuns()
    .map((run) => {
      const items = db.listRunItems(run.id);
      return {
        run,
        items: items
          .filter(
            (it) =>
              it.status === "IN_FINANCE_QUEUE" ||
              it.status === "PAID",
          )
          .map((it) => {
            const emp = db.getEmployee(it.employeeId)!;
            const bonuses = db.listAllRunBonusesForEmployee(run.id, emp.id);
            const deductions = db.listAllRunDeductionsForEmployee(run.id, emp.id);
            return { it, emp, bonuses, deductions };
          }),
      };
    })
    .filter((g) => g.items.length > 0);

  return (
    <AppShell title="Finance Queue">
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Payment queue
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Approved runs waiting for bank payment. Mark each employee as paid
            once the transfer is confirmed.
          </p>
        </div>

        {groups.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-base font-semibold text-slate-900">
              No payments pending
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Approved batches from HR will appear here.
            </p>
          </div>
        )}

        <FinanceQueue groups={groups} />
      </div>
    </AppShell>
  );
}
