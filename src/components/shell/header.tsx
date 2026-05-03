import { Search } from "lucide-react";
import { RoleSwitcher } from "./role-switcher";

export function Header({ title }: { title: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <span className="text-amber-500">👋</span>{" "}
          <span className="font-medium text-slate-900">Good morning, Yossef !</span>
        </div>
        <span className="text-sm text-slate-400">·</span>
        <span className="text-sm font-medium text-slate-700">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            placeholder="Search anything"
            className="h-8 w-56 rounded-md border border-slate-200 bg-white pl-8 pr-3 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>
        <RoleSwitcher />
      </div>
    </header>
  );
}
