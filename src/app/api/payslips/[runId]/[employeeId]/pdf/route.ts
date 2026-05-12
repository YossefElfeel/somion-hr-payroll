// Streams the payslip PDF for a single (run, employee) pair. Used by:
//   • the "View PDF" button on the employee details page (HR view)
//   • the "Print" button on /me (browser opens the PDF, native print dialog)
//
// No auth: same posture as the rest of the demo. Real deployment would gate
// by ownership (employee can read own; HR/ADMIN/FINANCE can read any).

import { NextResponse } from "next/server";
import { db } from "@/lib/domain/store";
import { loadStore } from "@/lib/domain/persistence";
import { renderPdf } from "@/lib/pdf/render";
import { PayslipDocument } from "@/lib/pdf/payslip";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string; employeeId: string }> },
) {
  await loadStore();
  const { runId, employeeId } = await params;

  const run = db.getRun(runId);
  const employee = db.getEmployee(employeeId);
  const item = db.getRunItem(runId, employeeId);
  if (!run || !employee || !item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bonuses = db.listAllRunBonusesForEmployee(runId, employeeId);
  const deductions = db.listAllRunDeductionsForEmployee(runId, employeeId);

  const pdf = await renderPdf(
    PayslipDocument({ employee, run, item, bonuses, deductions }),
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="payslip-${run.periodKey}-${employee.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
