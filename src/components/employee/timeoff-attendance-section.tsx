"use client";

import { useState } from "react";
import type { AttendanceEntry, LeaveRequest, LeaveBalance } from "@/lib/domain/types";
import { EmployeeSection } from "./section";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  attendance: AttendanceEntry[];
  leaveRequests: LeaveRequest[];
  leaveBalance: LeaveBalance | null;
}

export function TimeOffAttendanceSection({ attendance, leaveRequests, leaveBalance }: Props) {
  const [tab, setTab] = useState<"attendance" | "leave">("attendance");

  return (
    <EmployeeSection
      title="Time off & Attendance"
      action={
        <div className="flex gap-1 rounded-md border border-slate-200 bg-white p-0.5 text-xs">
          <button
            onClick={() => setTab("attendance")}
            className={`rounded px-2 py-1 ${tab === "attendance" ? "bg-brand-50 font-medium text-brand-700" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Attendance
          </button>
          <button
            onClick={() => setTab("leave")}
            className={`rounded px-2 py-1 ${tab === "leave" ? "bg-brand-50 font-medium text-brand-700" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Leave and balances
          </button>
        </div>
      }
    >
      {tab === "attendance" ? (
        <AttendanceTable rows={attendance} />
      ) : (
        <LeaveView requests={leaveRequests} balance={leaveBalance} />
      )}
    </EmployeeSection>
  );
}

function AttendanceTable({ rows }: { rows: AttendanceEntry[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
        No attendance records yet.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Start</th>
            <th className="px-3 py-2">End</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Log Hours</th>
            <th className="px-3 py-2">Overtime</th>
            <th className="px-3 py-2">Late</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2 text-slate-700">{formatDate(r.date)}</td>
              <td className="px-3 py-2 text-slate-700">{r.startWork}</td>
              <td className="px-3 py-2 text-slate-700">{r.endWork}</td>
              <td className="px-3 py-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {r.status === "APPROVED" ? "Approved" : "Late"}
                </span>
              </td>
              <td className="px-3 py-2 text-slate-700">{r.logHours}</td>
              <td className="px-3 py-2 text-slate-500">
                {r.overtimeMin > 0 ? `${r.overtimeMin} min` : "—"}
              </td>
              <td className="px-3 py-2 text-slate-500">
                {r.lateMin > 0 ? `${r.lateMin} min` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeaveView({
  requests,
  balance,
}: {
  requests: LeaveRequest[];
  balance: LeaveBalance | null;
}) {
  return (
    <>
      {balance && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <BalanceTile label="Available to book" value={`${balance.available} days`} sub="paid time off" />
          <BalanceTile label="Awaiting approval" value={`${balance.pending} days`} sub="pending approval" />
          <BalanceTile label="In the contract" value={`${balance.contractDays} days`} sub="national holidays" />
          <BalanceTile label="Booked / Used" value={`${balance.booked}d / ${balance.used}d`} sub="this year" />
        </div>
      )}

      {requests.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
          No leave requests yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
              <tr>
                <th className="px-3 py-2">Leave Type</th>
                <th className="px-3 py-2">Date From</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Date To</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-slate-700">{r.type}</td>
                  <td className="px-3 py-2 text-slate-700">{formatDate(r.dateFrom)}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {r.durationDays} day{r.durationDays === 1 ? "" : "s"}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{formatDate(r.dateTo)}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{r.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function BalanceTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-500">{sub}</div>
    </div>
  );
}
