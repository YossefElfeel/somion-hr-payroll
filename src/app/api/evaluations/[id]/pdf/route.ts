// Streams the evaluation PDF for a given evaluation id.

import { NextResponse } from "next/server";
import { db } from "@/lib/domain/store";
import { loadStore } from "@/lib/domain/persistence";
import { renderPdf } from "@/lib/pdf/render";
import { EvaluationDocument } from "@/lib/pdf/evaluation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await loadStore();
  const { id } = await params;

  const evalRow = db.getEvaluation(id);
  if (!evalRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const employee = db.getEmployee(evalRow.employeeId);
  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = await renderPdf(
    EvaluationDocument({ evaluation: evalRow, employee }),
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="evaluation-${evalRow.periodLabel.replace(/\s+/g, "-")}-${employee.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
