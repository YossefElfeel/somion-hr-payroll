import { RoleSwitcher } from "./role-switcher";
import { db } from "@/lib/domain/store";
import { loadStore } from "@/lib/domain/persistence";

export async function Header({ title: _title }: { title: string }) {
  // Fetch the employee list once for the role switcher's "sign in as employee"
  // submenu. loadStore is cached for ~2s per warm instance so this doesn't
  // add a round trip on top of whatever the page already loaded.
  await loadStore();
  const employees = db.listEmployees().map((e) => ({
    id: e.id,
    name: e.name,
    department: e.department,
  }));

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-sm">
        <span className="text-amber-500">👋</span>{" "}
        <span className="font-medium text-slate-900">Good morning, Yossef!</span>
      </div>
      <RoleSwitcher employees={employees} />
    </header>
  );
}
