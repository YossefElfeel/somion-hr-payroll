"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddEmployeeModal } from "./add-employee-modal";

// Tiny client wrapper around the modal so the /employees list page (a server
// component) can render a "+ Add Employee" button without becoming a client
// component itself.
export function AddEmployeeButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        <Plus size={14} /> Add Employee
      </button>
      <AddEmployeeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
