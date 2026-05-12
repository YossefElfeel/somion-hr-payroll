"use client";

import { Download, Printer } from "lucide-react";
import { EVALUATION_CATEGORIES, type Evaluation } from "@/lib/domain/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function MyEvaluations({ evaluations }: { evaluations: Evaluation[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">My Evaluations</h2>
      </header>
      <div className="p-5">
        {evaluations.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
            You don&apos;t have any evaluations yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {evaluations.map((ev) => (
              <li
                key={ev.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {ev.periodLabel}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {formatDate(ev.evaluatedAt)} · by {ev.evaluatedBy}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-brand-700">
                      {ev.overall.toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-500">/ 5</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-5 gap-1">
                  {EVALUATION_CATEGORIES.map((cat) => (
                    <div key={cat} className="flex flex-col items-center">
                      <span
                        className="grid h-7 w-7 place-items-center rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: scoreColor(ev.scores[cat]) }}
                      >
                        {ev.scores[cat]}
                      </span>
                      <span className="mt-1 max-w-16 truncate text-[10px] text-slate-500">
                        {cat}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-1">
                  <a
                    href={`/api/evaluations/${ev.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Download size={12} /> View
                  </a>
                  <a
                    href={`/api/evaluations/${ev.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Printer size={12} /> Print
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function scoreColor(score: number): string {
  if (score >= 5) return "#15803d";
  if (score >= 4) return "#65a30d";
  if (score >= 3) return "#ca8a04";
  if (score >= 2) return "#ea580c";
  return "#b91c1c";
}
