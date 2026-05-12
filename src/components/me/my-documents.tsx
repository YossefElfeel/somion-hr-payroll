"use client";

import { Download, Printer } from "lucide-react";
import type { IssuedDocument } from "@/lib/domain/types";

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

export function MyDocuments({ documents }: { documents: IssuedDocument[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">My Documents</h2>
      </header>
      <div className="p-5">
        {documents.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
            No HR letters or certificates issued to you yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-3 py-2">Issued</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Subject</th>
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
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <a
                          href={`/api/documents/${d.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Download size={12} /> View
                        </a>
                        <a
                          href={`/api/documents/${d.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Printer size={12} /> Print
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
