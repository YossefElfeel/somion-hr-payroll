"use client";

// Shared spec input for Bonus / Deduction modals. HR picks a type (Fixed,
// Days, Percent, Months) and types a value; we show a live CHF preview
// computed against the employee's current basicSalary. Submit handlers
// read `kind` + `value` from this component.

import type { AmountKind, AmountSpec } from "@/lib/domain/types";
import { formatAmountSpec, resolveAmount } from "@/lib/domain/totals";
import { Input, Label } from "@/components/ui/input";

interface Props {
  // The basicSalary used for the live preview. Optional — when no employee
  // is selected yet the preview is just hidden.
  basicSalary: number | null;
  // Current value (controlled).
  kind: AmountKind;
  value: string;       // string so empty / partial input is preserved
  // Setters.
  onKindChange: (k: AmountKind) => void;
  onValueChange: (v: string) => void;
  // Cosmetic — "Bonus" or "Deduction" to label inputs in HR-readable terms.
  label?: string;
}

interface TypeMeta {
  label: string;
  description: string;
  unit: string;
  placeholder: string;
  min: string;
  step: string;
}

// Per-kind UI metadata. Centralised so labels/placeholders stay in sync
// across modals and we can adjust in one place.
const META: Record<AmountKind, TypeMeta> = {
  FIXED: {
    label: "Fixed",
    description: "A flat CHF amount.",
    unit: "CHF",
    placeholder: "500",
    min: "1",
    step: "1",
  },
  DAYS: {
    label: "Days",
    description: "Number of days × daily rate (base ÷ 30).",
    unit: "days",
    placeholder: "2",
    min: "0.5",
    step: "0.5",
  },
  PERCENT: {
    label: "Percent",
    description: "A percentage of the employee's base salary.",
    unit: "%",
    placeholder: "10",
    min: "0.1",
    step: "0.1",
  },
  MONTHS: {
    label: "Months",
    description: "Whole or half multiples of monthly base salary.",
    unit: "months",
    placeholder: "1",
    min: "0.5",
    step: "0.5",
  },
};

const KINDS: AmountKind[] = ["FIXED", "DAYS", "PERCENT", "MONTHS"];

export function AmountSpecInput({
  basicSalary,
  kind,
  value,
  onKindChange,
  onValueChange,
  label,
}: Props) {
  const meta = META[kind];
  const numericValue = Number(value);
  const valid =
    value.length > 0 && Number.isFinite(numericValue) && numericValue > 0;

  // Live preview — only meaningful once we have both a basicSalary and a
  // valid number. For FIXED we just show the CHF amount; for the others
  // we render the breakdown via formatAmountSpec.
  let preview: string | null = null;
  if (valid && basicSalary !== null) {
    const spec: AmountSpec = { kind, value: numericValue };
    if (kind === "FIXED") {
      preview = formatAmountSpec(spec, basicSalary);
    } else {
      const resolved = resolveAmount(spec, basicSalary);
      if (resolved > 0) {
        preview = formatAmountSpec(spec, basicSalary);
      }
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>{label ?? "Amount"} type</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {KINDS.map((k) => (
            <TypeCard
              key={k}
              active={k === kind}
              title={META[k].label}
              onClick={() => onKindChange(k)}
            />
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">{meta.description}</p>
      </div>
      <div>
        <Label>{meta.label} value</Label>
        <div className="relative">
          <Input
            type="number"
            min={meta.min}
            step={meta.step}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={meta.placeholder}
            className="pr-14"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
            {meta.unit}
          </span>
        </div>
        {basicSalary !== null && (
          <p
            className={`mt-1.5 text-xs ${
              preview ? "text-slate-700" : "text-slate-400"
            }`}
          >
            {preview ? (
              <>Resolves to <span className="font-semibold">{preview}</span></>
            ) : (
              <>Enter a positive value to see the resolved CHF.</>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

// Compact, four-up radio cards. Match the visual hierarchy of TypeCard in
// the existing issue-document modal so the app feels consistent.
function TypeCard({
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
      className={`rounded-md border px-2 py-1.5 text-center text-xs font-medium transition-colors ${
        active
          ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
    >
      {title}
    </button>
  );
}
