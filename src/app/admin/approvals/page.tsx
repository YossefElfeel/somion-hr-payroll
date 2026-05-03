import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { RunStateBadge } from "@/components/payroll/run-state-badge";
import { db } from "@/lib/domain/store";
import { loadStore } from "@/lib/domain/persistence";

// Always read fresh from the persisted store. Without this, Next prerenders
// at build time using only the seed data and never picks up live mutations.
export const dynamic = "force-dynamic";
import { computeTotals, formatCHF } from "@/lib/domain/totals";

export default async function AdminApprovalsPage() {
  await loadStore();
  // Show every run that has at least one SUBMITTED employee waiting for review.
  // Multiple HR batches across days produce multiple cards — or one card with a
  // changing count, since a single run can have many SUBMITTED batches over time.
  const runs = db.listRuns().filter((r) => {
    const items = db.listRunItems(r.id);
    return items.some((it) => it.status === "SUBMITTED");
  });

  return (
    <AppShell title="Approvals">
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Pending approvals
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Each card is the current open batch HR sent for review. A single run
            can produce multiple batches across days.
          </p>
        </div>

        {runs.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-base font-semibold text-slate-900">All clear</h2>
            <p className="mt-1 text-sm text-slate-500">
              Nothing waiting for approval right now.
            </p>
          </div>
        )}

        <div className="grid gap-3">
          {runs.map((run) => {
            const items = db.listRunItems(run.id);
            const submittedItems = items.filter((it) => it.status === "SUBMITTED");
            const total = submittedItems.reduce((sum, it) => {
              const emp = db.getEmployee(it.employeeId);
              if (!emp) return sum;
              const t = computeTotals(
                emp,
                db.listAllRunBonusesForEmployee(run.id, it.employeeId),
                db.listAllRunDeductionsForEmployee(run.id, it.employeeId),
              );
              return sum + t.total;
            }, 0);
            const approvedAlready = items.filter((it) => it.status === "APPROVED").length;
            const flaggedAlready = items.filter((it) => it.status === "CHANGES_NEEDED").length;
            return (
              <Card key={run.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {run.periodLabel}
                      </h3>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">
                        {run.frequency}
                      </span>
                    </div>
                    <div className="mt-1">
                      <RunStateBadge state={run.state} />
                    </div>
                  </div>
                  <Link
                    href={`/admin/approvals/${run.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
                  >
                    Review <ArrowRight size={14} />
                  </Link>
                </CardHeader>
                <CardBody className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-slate-500">Pending review</div>
                    <div className="mt-1 font-medium text-slate-900">
                      {submittedItems.length} employee{submittedItems.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Pending payout</div>
                    <div className="mt-1 font-medium text-slate-900">
                      {formatCHF(total)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Already decided</div>
                    <div className="mt-1 font-medium text-slate-900">
                      {approvedAlready} approved · {flaggedAlready} flagged
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
