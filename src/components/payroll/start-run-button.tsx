"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startRun } from "@/lib/actions";
import type { PayrollFrequency } from "@/lib/domain/types";

export function StartRunButton({
  frequency,
  periodKey,
  periodLabel,
}: {
  frequency: PayrollFrequency;
  periodKey: string;
  periodLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await startRun({ frequency, periodKey, periodLabel });
        })
      }
    >
      <Plus size={14} /> Start run for {periodLabel}
    </Button>
  );
}
