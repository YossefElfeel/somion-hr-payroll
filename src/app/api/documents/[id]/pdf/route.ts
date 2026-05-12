// Streams the PDF for an issued document (experience certificate or HR letter).
// Branches on doc.type to pick the right renderer.

import { NextResponse } from "next/server";
import { db } from "@/lib/domain/store";
import { loadStore } from "@/lib/domain/persistence";
import { renderPdf } from "@/lib/pdf/render";
import { ExperienceCertificateDocument } from "@/lib/pdf/experience-certificate";
import { HRLetterDocument } from "@/lib/pdf/hr-letter";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await loadStore();
  const { id } = await params;

  const doc = db.getIssuedDocument(id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const employee = db.getEmployee(doc.employeeId);
  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf =
    doc.type === "EXPERIENCE_CERTIFICATE"
      ? await renderPdf(ExperienceCertificateDocument({ doc, employee }))
      : await renderPdf(HRLetterDocument({ doc, employee }));

  const slug =
    doc.type === "EXPERIENCE_CERTIFICATE"
      ? "experience-certificate"
      : "hr-letter";

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slug}-${employee.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
