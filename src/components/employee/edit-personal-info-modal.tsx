"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { updateEmployeeProfile } from "@/lib/actions";
import type { Employee } from "@/lib/domain/types";

interface Props {
  open: boolean;
  onClose: () => void;
  employee: Employee;
}

// Edits only the fields displayed in PersonalInfoSection. Everything is
// optional so HR can clear a field by submitting an empty value.
export function EditPersonalInfoModal({ open, onClose, employee }: Props) {
  const [name, setName] = useState(employee.name);
  const [email, setEmail] = useState(employee.email);
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [dob, setDob] = useState(employee.dob ?? "");
  const [gender, setGender] = useState<string>(employee.gender ?? "");
  const [nationality, setNationality] = useState(employee.nationality ?? "");
  const [nationalId, setNationalId] = useState(employee.nationalId ?? "");
  const [accommodationType, setAccommodationType] = useState(
    employee.accommodationType ?? "",
  );
  const [taxId, setTaxId] = useState(employee.taxId ?? "");
  const [postCode, setPostCode] = useState(employee.postCode ?? "");
  const [address, setAddress] = useState(employee.address ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && email.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Personal Information"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={pending || !canSubmit}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await updateEmployeeProfile(employee.id, {
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim() || undefined,
                    dob: dob || undefined,
                    gender: (gender || undefined) as Employee["gender"],
                    nationality: nationality.trim() || undefined,
                    nationalId: nationalId.trim() || undefined,
                    accommodationType: accommodationType.trim() || undefined,
                    taxId: taxId.trim() || undefined,
                    postCode: postCode.trim() || undefined,
                    address: address.trim() || undefined,
                  });
                  onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              });
            }}
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Full Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Date of Birth">
          <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </Field>
        <Field label="Gender">
          <Select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">—</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </Select>
        </Field>
        <Field label="Nationality">
          <Input
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
          />
        </Field>
        <Field label="National ID">
          <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
        </Field>
        <Field label="Accommodation type">
          <Input
            value={accommodationType}
            onChange={(e) => setAccommodationType(e.target.value)}
          />
        </Field>
        <Field label="Email Address">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone Number">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Personal Tax ID">
          <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} />
        </Field>
        <Field label="Post Code">
          <Input value={postCode} onChange={(e) => setPostCode(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address">
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </Field>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
