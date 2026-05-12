"use client";

import { useState, useTransition } from "react";
import { Download, Plus, Send, Star } from "lucide-react";
import { resendEvaluationEmail } from "@/lib/actions";
import { EVALUATION_CATEGORIES, type Evaluation } from "@/lib/domain/types";
import { useCurrentRole } from "@/components/shell/role-switcher";
import { EmployeeSection } from "./section";
import { EmailStatusBadge } from "./email-status-badge";
import { EvaluationModal } from "./evaluation-modal";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  employeeId: string;
  employeeName: string;
  evaluations: Evaluation[];
}

export function EvaluationsSection({ employeeId, employeeName, evaluations }: Props) {
  const role = useCurrentRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Latest-first ordering done in db. The "latest" is index 0.
  const latest = evaluations[0];
  const trendOrdered = [...evaluations].reverse(); // chronological for trend bar

  return (
    <>
      <EmployeeSection
        title="Evaluations"
        hint="Multi-category performance reviews. Each one is emailed and saved to the employee's dashboard."
        action={
          role === "HR" || role === "ADMIN" ? (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus size={12} /> New Evaluation
            </button>
          ) : null
        }
      >
        {evaluations.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
            No evaluations yet — start the first review cycle.
          </p>
        ) : (
          <>
            {/* Latest score + trend bar */}
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Latest overall score · {latest.periodLabel}
                </div>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-brand-700">
                    {latest.overall.toFixed(1)}
                  </div>
                  <div className="text-sm text-slate-500">/ 5</div>
                  <Star size={16} className="ml-1 fill-amber-400 text-amber-400" />
                </div>
              </div>
              <div className="flex items-end gap-1">
                {trendOrdered.slice(-5).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex flex-col items-center"
                    title={`${ev.periodLabel}: ${ev.overall.toFixed(1)}`}
                  >
                    <div className="h-16 w-3 overflow-hidden rounded-sm bg-slate-200">
                      <div
                        className="w-full bg-brand-500"
                        style={{
                          height: `${(ev.overall / 5) * 100}%`,
                          marginTop: `${100 - (ev.overall / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1 max-w-12 truncate text-[9px] text-slate-500">
                      {ev.periodLabel}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Period</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Evaluator</th>
                    <th className="px-3 py-2">Per category</th>
                    <th className="px-3 py-2">Overall</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evaluations.map((ev) => (
                    <tr key={ev.id}>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {ev.periodLabel}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {formatDate(ev.evaluatedAt)}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {ev.evaluatedBy}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {EVALUATION_CATEGORIES.map((cat) => (
                            <span
                              key={cat}
                              title={`${cat}: ${ev.scores[cat]} / 5`}
                              className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold text-white"
                              style={{
                                backgroundColor: scoreColor(ev.scores[cat]),
                              }}
                            >
                              {ev.scores[cat]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-semibold text-brand-700">
                        {ev.overall.toFixed(1)}
                      </td>
                      <td className="px-3 py-2">
                        <EmailStatusBadge status={ev.emailStatus} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-1">
                          <a
                            href={`/api/evaluations/${ev.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Download size={12} /> View PDF
                          </a>
                          <button
                            onClick={() =>
                              startTransition(async () => {
                                await resendEvaluationEmail(ev.id);
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
          </>
        )}
      </EmployeeSection>

      <EvaluationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        employeeId={employeeId}
        employeeName={employeeName}
      />
    </>
  );
}

// Score → traffic-light colour, used in the per-category dot row.
function scoreColor(score: number): string {
  if (score >= 5) return "#15803d";   // green-700
  if (score >= 4) return "#65a30d";   // lime-600
  if (score >= 3) return "#ca8a04";   // yellow-600
  if (score >= 2) return "#ea580c";   // orange-600
  return "#b91c1c";                   // red-700
}
