// Shared badge used by Payroll History, Evaluations, and HR Documents to
// surface email delivery state in a consistent way.

import type { EmailDeliveryStatus } from "@/lib/domain/types";

export function EmailStatusBadge({ status }: { status?: EmailDeliveryStatus }) {
  const s = status ?? "PENDING";
  const styles: Record<EmailDeliveryStatus, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    SENT: "bg-emerald-50 text-emerald-700",
    FAILED: "bg-red-50 text-red-700",
  };
  const label: Record<EmailDeliveryStatus, string> = {
    PENDING: "Sending…",
    SENT: "Sent",
    FAILED: "Failed",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[s]}`}
    >
      {label[s]}
    </span>
  );
}
