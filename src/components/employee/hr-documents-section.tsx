"use client";

import { useState, useTransition } from "react";
import { Download, Plus, Send } from "lucide-react";
import { resendDocumentEmail } from "@/lib/actions";
import { useCurrentRole } from "@/components/shell/role-switcher";
import type { IssuedDocument } from "@/lib/domain/types";
import { EmployeeSection } from "./section";
import { EmailStatusBadge } from "./email-status-badge";
import { IssueDocumentModal } from "./issue-document-modal";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const TYPE_LABEL = {
  EXPERIENCE_CERTIFICATE: "Experience Certificate",
  HR_LETTER: "HR Letter",
} as const;

const TYPE_BADGE = {
  EXPERIENCE_CERTIFICATE: "bg-violet-50 text-violet-700",
  HR_LETTER: "bg-sky-50 text-sky-700",
} as const;

interface Props {
  employeeId: string;
  employeeName: string;
  employeeJobTitle?: string;
  documents: IssuedDocument[];
}

export function HRDocumentsSection({
  employeeId,
  employeeName,
  employeeJobTitle,
  documents,
}: Props) {
  const role = useCurrentRole();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <EmployeeSection
        title="HR Letters & Certificates"
        hint="Experience certificates and HR letters issued by HR to this employee."
        action={
          role === "HR" || role === "ADMIN" ? (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus size={12} /> Issue Document
            </button>
          ) : null
        }
      >
        {documents.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
            No documents issued yet. Click <strong>Issue Document</strong> to
            generate an experience certificate or HR letter for this employee.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-3 py-2">Date issued</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">Issued by</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2 text-slate-700">
                      {formatDate(d.issuedAt)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_BADGE[d.type]}`}
                      >
                        {TYPE_LABEL[d.type]}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {d.subject}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{d.issuedBy}</td>
                    <td className="px-3 py-2">
                      <EmailStatusBadge status={d.emailStatus} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <a
                          href={`/api/documents/${d.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Download size={12} /> View PDF
                        </a>
                        <button
                          onClick={() =>
                            startTransition(async () => {
                              await resendDocumentEmail(d.id);
                            })
                          }
                          disabled={pending}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <Send size={12} /> Resend
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </EmployeeSection>

      <IssueDocumentModal
        open={open}
        onClose={() => setOpen(false)}
        employeeId={employeeId}
        employeeName={employeeName}
        employeeJobTitle={employeeJobTitle}
      />
    </>
  );
}
