import type { EmployeeActivity } from "@/lib/domain/types";
import { EmployeeSection } from "./section";

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return `${d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export function ActivitySection({ activity }: { activity: EmployeeActivity[] }) {
  return (
    <EmployeeSection title="Activity" hint="Recent events on this employee.">
      {activity.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
          No activity recorded yet.
        </p>
      ) : (
        <ol className="relative space-y-3 border-l border-slate-200 pl-4">
          {activity.map((a) => (
            <li key={a.id} className="relative">
              <span className="absolute -left-[7px] top-1 grid h-2.5 w-2.5 place-items-center rounded-full bg-brand-500" />
              <p className="text-sm text-slate-800">{a.message}</p>
              <p className="mt-0.5 text-xs text-slate-500">{formatRelative(a.at)}</p>
            </li>
          ))}
        </ol>
      )}
    </EmployeeSection>
  );
}
