import { RoleSwitcher } from "./role-switcher";

export function Header({ title: _title }: { title: string }) {
  // The page-level <h1> below the header already states the page name, so
  // the header now just carries the greeting + role switch — no search bar
  // (was a fake input) and no breadcrumb (was a duplicate of the <h1>).
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-sm">
        <span className="text-amber-500">👋</span>{" "}
        <span className="font-medium text-slate-900">Good morning, Yossef!</span>
      </div>
      <RoleSwitcher />
    </header>
  );
}
