import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { ApprovalReview } from "@/components/admin/approval-review";
import { db } from "@/lib/domain/store";

interface Params {
  runId: string;
}

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { runId } = await params;
  const run = db.getRun(runId);
  if (!run) notFound();

  const items = db.listRunItems(runId);
  const employees = db.listEmployees();

  // Admin only sees employees currently SUBMITTED — i.e. the open batch awaiting
  // their decision. Already-approved or already-flagged employees aren't actionable here.
  const rows = items
    .filter((it) => it.status === "SUBMITTED")
    .map((it) => {
      const emp = employees.find((e) => e.id === it.employeeId)!;
      const empBonuses = db.listAllRunBonusesForEmployee(runId, emp.id);
      const empDeductions = db.listAllRunDeductionsForEmployee(runId, emp.id);
      return { item: it, emp, empBonuses, empDeductions };
    });

  return (
    <AppShell title="Approve Run">
      <div className="mx-auto max-w-6xl p-6">
        <ApprovalReview run={run} rows={rows} audit={db.listAudit(runId)} />
      </div>
    </AppShell>
  );
}
