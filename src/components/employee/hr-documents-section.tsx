"use client";

import { useState, useTransition } from "react";
import { Download, FileBadge, Mail, Send } from "lucide-react";
import { resendDocumentEmail } from "@/lib/actions";
import { useCurrentRole } from "@/components/shell/role-switcher";
import type { IssuedDocument } from "@/lib/domain/types";
import { EmployeeSection } from "./section";
import { EmailStatusBadge } from "./email-status-badge";
import { IssueExperienceCertificateModal } from "./issue-experience-certificate-modal";
import { IssueHRLetterModal } from "./issue-hr-letter-modal";

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
  // Used by the cert modal for smart defaults (start date pre-fill, default
  // "still employed" toggle based on whether status is Inactive).
  employeeJoinDate?: string;
  employeeStatus?: string;
  documents: IssuedDocument[];
}

export function HRDocumentsSection({
  employeeId,
  employeeName,
  employeeJobTitle,
  employeeJoinDate,
  employeeStatus,
  documents,
}: Props) {
  const role = useCurrentRole();
  // Two separate flags so we never accidentally render both modals.
  const [certOpen, setCertOpen] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const canIssue = role === "HR" || role === "ADMIN";

  return (
    <>
      <EmployeeSection
        title="HR Letters & Certificates"
        hint="Experience certificates and HR letters issued by HR to this employee."
        action={
          canIssue ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setCertOpen(true)}
                className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
              >
                <FileBadge size={12} /> Experience Cert
              </button>
              <button
                onClick={() => setLetterOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Mail size={12} /> HR Letter
              </button>
            </div>
          ) : null
        }
      >
        {documents.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
            No documents issued yet. Use{" "}
            <strong>Experience Cert</strong> or <strong>HR Letter</strong> to
            issue one — it&apos;s emailed to the employee and listed below.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-3 py-2">Date issued</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Subject / Reference</th>
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
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          TYPE_BADGE[d.type]
                        }`}
                      >
                        {TYPE_LABEL[d.type]}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">{d.subject}</div>
                      {d.referenceNumber && (
                        <div className="text-[10px] uppercase tracking-wider text-slate-400">
                          {d.referenceNumber}
                        </div>
                      )}
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

      <IssueExperienceCertificateModal
        open={certOpen}
        onClose={() => setCertOpen(false)}
        employeeId={employeeId}
        employeeName={employeeName}
        employeeJobTitle={employeeJobTitle}
        employeeJoinDate={employeeJoinDate}
        employeeStatus={employeeStatus}
      />
      <IssueHRLetterModal
        open={letterOpen}
        onClose={() => setLetterOpen(false)}
        employeeId={employeeId}
        employeeName={employeeName}
      />
    </>
  );
}
