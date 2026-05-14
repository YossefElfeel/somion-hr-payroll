"use client";

// Shared reason selector for Issue Experience Certificate / Issue HR Letter
// modals. HR picks one of the preset reasons or "Other" → free-text input.
// The component is fully controlled: parent owns the resolved `reason`
// string (which is what gets persisted on the document payload).

import { ISSUED_DOCUMENT_REASONS } from "@/lib/domain/types";
import { Input, Label } from "@/components/ui/input";

const OTHER = "__OTHER__" as const;

interface Props {
  // The currently-stored reason string (whatever ends up on the payload).
  value: string;
  onChange: (next: string) => void;
  label?: string;
  // Optional override for the "Other" reveal text. Defaults to a generic
  // placeholder.
  otherPlaceholder?: string;
}

export function ReasonPicker({
  value,
  onChange,
  label,
  otherPlaceholder = "Describe the reason for issuance",
}: Props) {
  // We treat any non-preset value as the "Other" path. The preset list is
  // small enough that string-matching here is fine and avoids a separate
  // "isOther" boolean that could drift out of sync with `value`.
  const presetSet = new Set<string>(ISSUED_DOCUMENT_REASONS as readonly string[]);
  const isOther = value.length > 0 && !presetSet.has(value);
  const selected = isOther ? OTHER : value;

  return (
    <div>
      <Label>{label ?? "Reason for issuance"}</Label>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {ISSUED_DOCUMENT_REASONS.map((r) => (
          <ReasonCard
            key={r}
            active={selected === r}
            title={r}
            onClick={() => onChange(r)}
          />
        ))}
        <ReasonCard
          active={selected === OTHER}
          title="Other"
          onClick={() => onChange(isOther ? value : "")}
        />
      </div>
      {selected === OTHER && (
        <Input
          className="mt-2"
          value={isOther ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={otherPlaceholder}
        />
      )}
    </div>
  );
}

function ReasonCard({
  active,
  title,
  onClick,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
        active
          ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
    >
      {title}
    </button>
  );
}
