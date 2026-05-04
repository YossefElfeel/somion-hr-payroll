"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, CheckCircle2, CircleDollarSign } from "lucide-react";
import { useCurrentRole } from "./role-switcher";
import type { Role } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof CalendarClock;
  roles: Role[];
}

// Role gating lives here. Each route advertises which roles it's relevant
// for; the sidebar hides items the active role doesn't need so HR doesn't
// see Finance's queue (and vice versa).
const ITEMS: NavItem[] = [
  { href: "/payroll", label: "Payroll", icon: CalendarClock, roles: ["HR"] },
  { href: "/admin/approvals", label: "Approvals", icon: CheckCircle2, roles: ["ADMIN"] },
  { href: "/finance/queue", label: "Finance Queue", icon: CircleDollarSign, roles: ["FINANCE"] },
];

export function Sidebar() {
  const role = useCurrentRole();
  const pathname = usePathname() ?? "";
  const visible = ITEMS.filter((it) => it.roles.includes(role));

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

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
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Main
        </div>
        <ul className="space-y-0.5">
          {visible.map((it) => {
            const Icon = it.icon;
            const active = isActive(it.href);
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-brand-50 text-brand-700 font-medium"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <Icon size={16} />
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="px-5 pb-4 text-[10px] uppercase tracking-wider text-slate-400">
        Role: {role}
      </div>
    </aside>
  );
}
