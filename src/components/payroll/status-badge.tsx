import { Badge } from "@/components/ui/badge";
import {
  employeeStatusColor,
  employeeStatusLabel,
} from "@/lib/domain/state-machine";
import type { EmployeePaymentStatus } from "@/lib/domain/types";

export function StatusBadge({ status }: { status: EmployeePaymentStatus }) {
  const c = employeeStatusColor(status);
  return (
    <Badge bg={c.bg} text={c.text}>
      {employeeStatusLabel(status)}
    </Badge>
  );
}
