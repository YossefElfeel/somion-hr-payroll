"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, User } from "lucide-react";
import type { Role } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "somion.role";
const ROLE_EVENT = "somion.role.changed";

export function getStoredRole(): Role {
  if (typeof window === "undefined") return "HR";
  return (localStorage.getItem(STORAGE_KEY) as Role) ?? "HR";
}

// Subscribe to role changes from anywhere in the app. Fires on the custom
// event the switcher dispatches, plus the native `storage` event (other tabs).
export function useCurrentRole(): Role {
  const [role, setRole] = useState<Role>("HR");
  useEffect(() => {
    setRole(getStoredRole());
    const onChange = () => setRole(getStoredRole());
    window.addEventListener(ROLE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(ROLE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return role;
}

export function RoleSwitcher() {
  const router = useRouter();
  const role = useCurrentRole();
  const [open, setOpen] = useState(false);

  const setStored = (next: Role) => {
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(ROLE_EVENT));
    setOpen(false);
    if (next === "HR") router.push("/payroll");
    if (next === "ADMIN") router.push("/admin/approvals");
    if (next === "FINANCE") router.push("/finance/queue");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        <User size={14} />
        <span className="font-medium">{roleLabel(role)}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {(["HR", "ADMIN", "FINANCE"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setStored(r)}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50",
                r === role ? "font-semibold text-brand-700" : "text-slate-700",
              )}
            >
              <span>{roleLabel(r)}</span>
              <span className="text-xs text-slate-400">{rolePath(r)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function roleLabel(r: Role) {
  return { HR: "HR", ADMIN: "Admin", FINANCE: "Finance" }[r];
}
function rolePath(r: Role) {
  return { HR: "/payroll", ADMIN: "/admin/approvals", FINANCE: "/finance/queue" }[r];
}
