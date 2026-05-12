"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Employee } from "@/lib/domain/types";
import { useCurrentRole } from "@/components/shell/role-switcher";
import { EditSkillsModal } from "./edit-skills-modal";

export function EmployeeHeader({ employee }: { employee: Employee }) {
  const role = useCurrentRole();
  const [skillsOpen, setSkillsOpen] = useState(false);
  const canEdit = role === "HR" || role === "ADMIN";

  const initials = employee.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-start gap-5 px-5 py-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-50 text-lg font-semibold text-brand-700">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">
                {employee.name}
              </h1>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {employee.status ?? "Active"}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {employee.jobTitle ?? employee.department} · {employee.department}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-3">
              <Stat label="Last clocked in" value="A few seconds ago" />
              <Stat label="Last messaged" value="2 days ago" />
              <Stat label="Employee ID" value={employee.id} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {employee.skills && employee.skills.length > 0 ? (
                employee.skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No skills listed.</span>
              )}
              {canEdit && (
                <button
                  onClick={() => setSkillsOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Pencil size={11} /> Edit skills
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <EditSkillsModal
        open={skillsOpen}
        onClose={() => setSkillsOpen(false)}
        employeeId={employee.id}
        initialSkills={employee.skills ?? []}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="text-sm text-slate-800">{value}</div>
    </div>
  );
}
