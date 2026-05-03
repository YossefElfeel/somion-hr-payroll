import { Badge } from "@/components/ui/badge";
import { runStateColor, runStateLabel } from "@/lib/domain/state-machine";
import type { RunState } from "@/lib/domain/types";

export function RunStateBadge({ state }: { state: RunState }) {
  const c = runStateColor(state);
  return (
    <Badge bg={c.bg} text={c.text} ring={c.ring}>
      {runStateLabel(state)}
    </Badge>
  );
}
