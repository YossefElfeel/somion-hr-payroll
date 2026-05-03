import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Users,
  Briefcase,
  Building2,
} from "lucide-react";

const groups = [
  {
    label: "Main",
    items: [
      { href: "/payroll", label: "Payroll", icon: CalendarClock },
      { href: "/admin/approvals", label: "Approvals", icon: CheckCircle2 },
      { href: "/finance/queue", label: "Finance Queue", icon: CircleDollarSign },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/employees", label: "Employees", icon: Users, disabled: true },
      { href: "/projects", label: "Projects", icon: Briefcase, disabled: true },
      { href: "/departments", label: "Departments", icon: Building2, disabled: true },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-44 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-5">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-brand-600 text-white">
          <span className="text-sm font-bold">S</span>
        </div>
        <span className="text-sm font-semibold tracking-tight text-slate-900">
          SOMION
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <div key={g.label} className="mb-5">
            <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {g.label}
            </div>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const Icon = it.icon;
                if ("disabled" in it && it.disabled) {
                  return (
                    <li key={it.href}>
                      <span className="flex cursor-not-allowed items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-400">
                        <Icon size={16} />
                        {it.label}
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <Icon size={16} />
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
