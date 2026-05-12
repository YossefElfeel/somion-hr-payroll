"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ChevronDown, ChevronLeft, User } from "lucide-react";
import type { Role } from "@/lib/domain/types";
import { setCurrentEmployee } from "@/lib/actions";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "somion.role";
const EMPLOYEE_KEY = "somion.employeeId";
const ROLE_EVENT = "somion.role.changed";

export function getStoredRole(): Role {
  if (typeof window === "undefined") return "HR";
  return (localStorage.getItem(STORAGE_KEY) as Role) ?? "HR";
}

export function getStoredEmployeeId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EMPLOYEE_KEY);
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

interface EmployeeOption {
  id: string;
  name: string;
  department: string;
}

interface Props {
  // Employees available to "sign in as" when switching to the EMPLOYEE role.
  // Passed from the server-rendered Header so the client doesn't need to fetch.
  employees: EmployeeOption[];
}

export function RoleSwitcher({ employees }: Props) {
  const router = useRouter();
  const role = useCurrentRole();
  const [open, setOpen] = useState(false);
  // Two-step menu: top-level role list, then (if EMPLOYEE picked) the
  // sign-in-as-which-employee list.
  const [pickingEmployee, setPickingEmployee] = useState(false);
  const [pending, startTransition] = useTransition();

  const setStored = (next: Role) => {
    if (next === "EMPLOYEE") {
      setPickingEmployee(true);
      return;
    }
    localStorage.setItem(STORAGE_KEY, next);
    localStorage.removeItem(EMPLOYEE_KEY);
    window.dispatchEvent(new Event(ROLE_EVENT));
    setOpen(false);
    setPickingEmployee(false);
    // Clear the server cookie too so /me doesn't render stale state.
    startTransition(() => setCurrentEmployee(""));
    if (next === "HR") router.push("/employees");
    if (next === "ADMIN") router.push("/admin/approvals");
    if (next === "FINANCE") router.push("/finance/queue");
  };

  const pickEmployee = (empId: string) => {
    localStorage.setItem(STORAGE_KEY, "EMPLOYEE");
    localStorage.setItem(EMPLOYEE_KEY, empId);
    window.dispatchEvent(new Event(ROLE_EVENT));
    setOpen(false);
    setPickingEmployee(false);
    startTransition(() => {
      setCurrentEmployee(empId).then(() => router.push("/me"));
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((s) => !s);
          setPickingEmployee(false);
        }}
        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        <User size={14} />
        <span className="font-medium">{roleLabel(role)}</span>
        <ChevronDown size={14} />
      </button>
      {open && !pickingEmployee && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {(["HR", "ADMIN", "FINANCE", "EMPLOYEE"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setStored(r)}
              disabled={pending}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50",
                r === role ? "font-semibold text-brand-700" : "text-slate-700",
              )}
            >
              <span>{roleLabel(r)}</span>
              <span className="text-xs text-slate-400">{rolePath(r)}</span>
            </button>
          ))}
        </div>
      )}
      {open && pickingEmployee && (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <button
              onClick={() => setPickingEmployee(false)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Back"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sign in as which employee?
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {employees.length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-500">
                No employees available.
              </div>
            ) : (
              employees.map((e) => (
                <button
                  key={e.id}
                  onClick={() => pickEmployee(e.id)}
                  disabled={pending}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="font-medium">{e.name}</span>
                  <span className="text-xs text-slate-400">{e.department}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function roleLabel(r: Role) {
  return { HR: "HR", ADMIN: "Admin", FINANCE: "Finance", EMPLOYEE: "Employee" }[r];
}
function rolePath(r: Role) {
  return {
    HR: "/employees",
    ADMIN: "/admin/approvals",
    FINANCE: "/finance/queue",
    EMPLOYEE: "/me",
  }[r];
}
