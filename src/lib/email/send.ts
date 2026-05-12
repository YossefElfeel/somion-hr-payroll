// Email orchestration: pulls data from the store, renders the right PDF,
// renders the right React Email template, sends via Resend (with PDF
// attached), and flips the matching email-status field on the source row.
//
// Each `send*` function is fire-and-forget from the perspective of callers.
// It handles its own load/save/revalidate so server actions can just spawn
// it via `queueMicrotask` after the primary mutation.

import "server-only";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/domain/store";
import { loadStore, saveStore } from "@/lib/domain/persistence";
import { renderPdf } from "@/lib/pdf/render";
import { PayslipDocument } from "@/lib/pdf/payslip";
import { EvaluationDocument } from "@/lib/pdf/evaluation";
import { ExperienceCertificateDocument } from "@/lib/pdf/experience-certificate";
import { HRLetterDocument } from "@/lib/pdf/hr-letter";
import { PayslipEmail } from "@/lib/email/templates/payslip";
import { EvaluationEmail } from "@/lib/email/templates/evaluation";
import { ExperienceCertificateEmail } from "@/lib/email/templates/experience-certificate";
import { HRLetterEmail } from "@/lib/email/templates/hr-letter";
import { getResend, defaultFrom, appBaseUrl } from "./client";
import { computeTotals } from "@/lib/domain/totals";
import { formatCHF } from "@/lib/pdf/styles";
import type {
  ExperienceCertificatePayload,
  HRLetterPayload,
} from "@/lib/domain/types";

// Single shape we hand off to Resend (`react` is the email body, `attachments`
// carries the PDF). Pulled into a helper so each `send*` function reads cleanly.
interface OutgoingMail {
  to: string;
  subject: string;
  // Resend will render this with React Email under the hood. Loose typing
  // because the SDK's typings expect a JSX element but we hand them concrete
  // template components.
  react: React.ReactElement;
  attachments: Array<{ filename: string; content: Buffer }>;
}

async function deliver(mail: OutgoingMail): Promise<"SENT" | "FAILED"> {
  const resend = getResend();
  if (!resend) {
    // Local/dev fallback — log the payload and pretend success so the demo
    // doesn't end up with rows stuck in PENDING when no API key is configured.
    console.log("[email:dev]", {
      from: defaultFrom(),
      to: mail.to,
      subject: mail.subject,
      attachments: mail.attachments.map((a) => `${a.filename} (${a.content.length} bytes)`),
    });
    return "SENT";
  }
  try {
    const result = await resend.emails.send({
      from: defaultFrom(),
      to: mail.to,
      subject: mail.subject,
      react: mail.react,
      attachments: mail.attachments,
    });
    if (result.error) {
      console.error("[email] resend error:", result.error);
      return "FAILED";
    }
    return "SENT";
  } catch (err) {
    console.error("[email] send threw:", err);
    return "FAILED";
  }
}

// ── Payslip ────────────────────────────────────────────────────────────────

export async function sendPayslipEmail(runId: string, employeeId: string) {
  await loadStore();
  const run = db.getRun(runId);
  const employee = db.getEmployee(employeeId);
  const item = db.getRunItem(runId, employeeId);
  if (!run || !employee || !item) {
    console.error("[email] sendPayslipEmail: missing run/employee/item", { runId, employeeId });
    return;
  }
  const bonuses = db.listAllRunBonusesForEmployee(runId, employeeId);
  const deductions = db.listAllRunDeductionsForEmployee(runId, employeeId);
  const totals = computeTotals(employee, bonuses, deductions);

  const pdf = await renderPdf(
    PayslipDocument({ employee, run, item, bonuses, deductions }),
  );

  const status = await deliver({
    to: employee.email,
    subject: `[Somion] Payslip — ${run.periodLabel} — ${employee.name}`,
    react: PayslipEmail({
      employeeName: employee.name,
      periodLabel: run.periodLabel,
      netTotal: formatCHF(totals.total),
      dashboardUrl: `${appBaseUrl()}/me`,
    }),
    attachments: [
      {
        filename: `payslip-${run.periodKey}-${employee.id}.pdf`,
        content: pdf,
      },
    ],
  });

  db.setRunItemPayslipEmailStatus(item.id, status);
  await saveStore();
  revalidatePath(`/employees/${employeeId}`);
  revalidatePath("/me");
}

// ── Evaluation ─────────────────────────────────────────────────────────────

export async function sendEvaluationEmail(evaluationId: string) {
  await loadStore();
  const evalRow = db.getEvaluation(evaluationId);
  if (!evalRow) {
    console.error("[email] sendEvaluationEmail: evaluation not found", evaluationId);
    return;
  }
  const employee = db.getEmployee(evalRow.employeeId);
  if (!employee) {
    console.error("[email] sendEvaluationEmail: employee not found", evalRow.employeeId);
    return;
  }

  const pdf = await renderPdf(EvaluationDocument({ evaluation: evalRow, employee }));

  const status = await deliver({
    to: employee.email,
    subject: `[Somion] Performance Evaluation — ${evalRow.periodLabel} — ${employee.name}`,
    react: EvaluationEmail({
      employeeName: employee.name,
      evaluation: evalRow,
      dashboardUrl: `${appBaseUrl()}/me`,
    }),
    attachments: [
      {
        filename: `evaluation-${evalRow.periodLabel.replace(/\s+/g, "-")}-${employee.id}.pdf`,
        content: pdf,
      },
    ],
  });

  db.setEvaluationEmailStatus(evalRow.id, status);
  await saveStore();
  revalidatePath(`/employees/${employee.id}`);
  revalidatePath("/me");
}

// ── Issued document (experience certificate / HR letter) ───────────────────

export async function sendDocumentEmail(documentId: string) {
  await loadStore();
  const doc = db.getIssuedDocument(documentId);
  if (!doc) {
    console.error("[email] sendDocumentEmail: document not found", documentId);
    return;
  }
  const employee = db.getEmployee(doc.employeeId);
  if (!employee) {
    console.error("[email] sendDocumentEmail: employee not found", doc.employeeId);
    return;
  }

  let pdf: Buffer;
  let react: React.ReactElement;
  let subject: string;
  let filename: string;

  if (doc.type === "EXPERIENCE_CERTIFICATE") {
    const payload = doc.payload as ExperienceCertificatePayload;
    pdf = await renderPdf(ExperienceCertificateDocument({ doc, employee }));
    react = ExperienceCertificateEmail({
      employeeName: employee.name,
      position: payload.position,
      dashboardUrl: `${appBaseUrl()}/me`,
      issuedBy: doc.issuedBy,
    });
    subject = `[Somion] Experience Certificate — ${employee.name}`;
    filename = `experience-certificate-${employee.id}.pdf`;
  } else {
    const payload = doc.payload as HRLetterPayload;
    pdf = await renderPdf(HRLetterDocument({ doc, employee }));
    react = HRLetterEmail({
      employeeName: employee.name,
      purpose: payload.purpose,
      addressedTo: payload.addressedTo,
      dashboardUrl: `${appBaseUrl()}/me`,
      issuedBy: doc.issuedBy,
    });
    subject = `[Somion] HR Letter — ${payload.purpose} — ${employee.name}`;
    filename = `hr-letter-${employee.id}.pdf`;
  }

  const status = await deliver({
    to: employee.email,
    subject,
    react,
    attachments: [{ filename, content: pdf }],
  });

  db.setIssuedDocumentEmailStatus(doc.id, status);
  await saveStore();
  revalidatePath(`/employees/${employee.id}`);
  revalidatePath("/me");
}
