import { MessageSquare, Users } from "lucide-react";
import type { Project } from "@/lib/domain/types";
import { EmployeeSection } from "./section";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_COLORS: Record<Project["status"], string> = {
  Approved: "bg-emerald-50 text-emerald-700",
  Testing: "bg-amber-50 text-amber-700",
  InProgress: "bg-violet-50 text-violet-700",
  Done: "bg-slate-100 text-slate-700",
};

export function ProjectsSection({ projects }: { projects: Project[] }) {
  return (
    <EmployeeSection title="Projects">
      {projects.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
          Not assigned to any projects yet.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  {p.title}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[p.status]}`}
                >
                  {p.status === "InProgress" ? "In Progress" : p.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{p.description}</p>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{p.percentComplete}% completed</span>
                  <span>{formatDate(p.dueDate)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-brand-500"
                    style={{ width: `${p.percentComplete}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Users size={12} /> {p.members}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare size={12} /> {p.comments}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </EmployeeSection>
  );
}
