// Shared card-style section shell used across every panel on the employee
// details page. Header has a title and optional right-side action slot.

import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  // Optional subtitle / hint under the title.
  hint?: string;
}

export function EmployeeSection({ title, children, action, hint }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {hint && (
            <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

// Tiny grid of label/value pairs, used by Personal/Employee/Bank sections.
export function InfoGrid({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col">
          <dt className="text-xs uppercase tracking-wider text-slate-400">
            {it.label}
          </dt>
          <dd className="mt-0.5 text-sm text-slate-800">
            {it.value ?? <span className="text-slate-400">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
