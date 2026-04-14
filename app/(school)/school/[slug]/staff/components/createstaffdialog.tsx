"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createStaff } from "@/actions/staff-actions";

// ── Types ──────────────────────────────────────────────────────────────────────

type Role = {
  id: string;
  roleName: string;
  displayName: string;
};

type StaffRoleDefinition = {
  id: string;
  name: string;
  code: string;
  roleType: string;
};

interface CreateStaffDialogProps {
  schoolId: string;
  assignableRoles: Role[];
  staffRoleDefinitions: StaffRoleDefinition[];
  /** Control visibility externally */
  open: boolean;
  onClose: () => void;
  /** Optional: called after successful creation */
  onSuccess?: () => void;
}

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Personal Info",   icon: "👤" },
  { id: 2, label: "Employment",      icon: "💼" },
  { id: 3, label: "System Access",   icon: "🔐" },
  { id: 4, label: "Review & Submit", icon: "✅" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
    />
  );
}

// ── Role chip component ───────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  teacher:      "bg-blue-50 border-blue-200 text-blue-700",
  librarian:    "bg-amber-50 border-amber-200 text-amber-700",
  bursar:       "bg-emerald-50 border-emerald-200 text-emerald-700",
  accountant:   "bg-teal-50 border-teal-200 text-teal-700",
  nurse:        "bg-pink-50 border-pink-200 text-pink-700",
  school_admin: "bg-blue-50 border-blue-200 text-blue-700",
  admin:        "bg-blue-50 border-blue-200 text-blue-700",
  user:         "bg-slate-50 border-slate-200 text-slate-600",
};

function RoleChip({
  role,
  selected,
  onClick,
}: {
  role: Role;
  selected: boolean;
  onClick: () => void;
}) {
  const colorClass =
    ROLE_COLORS[role.roleName] ?? "bg-indigo-50 border-indigo-200 text-indigo-700";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
        selected
          ? `${colorClass} shadow-sm ring-2 ring-offset-1 ${
              colorClass.includes("blue") ? "ring-blue-300" :
              colorClass.includes("amber") ? "ring-amber-300" :
              colorClass.includes("emerald") ? "ring-emerald-300" :
              colorClass.includes("teal") ? "ring-teal-300" :
              colorClass.includes("pink") ? "ring-pink-300" :
              colorClass.includes("purple") ? "ring-blue-300" :
              "ring-indigo-300"
            }`
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          selected ? "bg-current opacity-80" : "bg-slate-300"
        }`}
      />
      {role.displayName || role.roleName}
      {selected && (
        <span className="ml-auto text-xs opacity-70">✓</span>
      )}
    </button>
  );
}

// ── Review helpers ─────────────────────────────────────────────────────────────

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</p>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50">
        {children}
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="shrink-0 text-xs text-slate-500">{label}</span>
      <span className={`text-right text-sm ${muted ? "italic text-slate-400" : "font-medium text-slate-800"}`}>
        {value}
      </span>
    </div>
  );
}

// ── Main Dialog Component ──────────────────────────────────────────────────────

export default function CreateStaffDialog({
  schoolId,
  assignableRoles,
  staffRoleDefinitions,
  open,
  onClose,
  onSuccess,
}: CreateStaffDialogProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setError(null);
      setFirstName(""); setLastName(""); setPhone(""); setEmail("");
      setGender(""); setDob(""); setNationality(""); setNationalId("");
      setAddress(""); setPassword("");
      setStaffType("TEACHING"); setEmploymentType("FULL_TIME");
      setDateOfHire(""); setBasicSalary(""); setHighestQualification("");
      setSpecialization(""); setNssfNumber(""); setTinNumber("");
      setBankName(""); setBankAccount(""); setEmergencyName("");
      setEmergencyPhone(""); setEmergencyRelationship("");
      setSelectedRoleIds([]); setRoleDefinitionId("");
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSubmitting, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ── Form state ──────────────────────────────────────────────────────────────

  const [firstName, setFirstName]     = useState("");
  const [lastName, setLastName]       = useState("");
  const [phone, setPhone]             = useState("");
  const [email, setEmail]             = useState("");
  const [gender, setGender]           = useState("");
  const [dob, setDob]                 = useState("");
  const [nationality, setNationality] = useState("");
  const [nationalId, setNationalId]   = useState("");
  const [address, setAddress]         = useState("");
  const [password, setPassword]       = useState("");

  const [staffType, setStaffType]               = useState<"TEACHING" | "NON_TEACHING" | "SUPPORT">("TEACHING");
  const [employmentType, setEmploymentType]     = useState<"FULL_TIME" | "PART_TIME" | "CONTRACT" | "VOLUNTEER">("FULL_TIME");
  const [dateOfHire, setDateOfHire]             = useState("");
  const [basicSalary, setBasicSalary]           = useState("");
  const [highestQualification, setHighestQualification] = useState("");
  const [specialization, setSpecialization]     = useState("");
  const [nssfNumber, setNssfNumber]             = useState("");
  const [tinNumber, setTinNumber]               = useState("");
  const [bankName, setBankName]                 = useState("");
  const [bankAccount, setBankAccount]           = useState("");
  const [emergencyName, setEmergencyName]       = useState("");
  const [emergencyPhone, setEmergencyPhone]     = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [roleDefinitionId, setRoleDefinitionId] = useState("");

  // ── Step validation ─────────────────────────────────────────────────────────

  const step1Valid = firstName && lastName && phone && email && gender;
  const step2Valid = staffType && employmentType && dateOfHire;

  const canProceed = () => {
    if (currentStep === 1) return !!step1Valid;
    if (currentStep === 2) return !!step2Valid;
    return true;
  };

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    if (canProceed() && currentStep < STEPS.length) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, canProceed]);

  const goBack = useCallback(() => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await createStaff({
        schoolId,
        firstName,
        lastName,
        phone,
        email,
        password: password || undefined,
        gender,
        dob: dob ? new Date(dob) : undefined,
        nationality: nationality || undefined,
        nationalId: nationalId || undefined,
        address: address || undefined,
        staffType: staffType as any,
        employmentType: employmentType as any,
        dateOfHire: new Date(dateOfHire),
        basicSalary: basicSalary ? Number(basicSalary) : undefined,
        highestQualification: highestQualification || undefined,
        specialization: specialization || undefined,
        nssfNumber: nssfNumber || undefined,
        tinNumber: tinNumber || undefined,
        bankName: bankName || undefined,
        bankAccount: bankAccount || undefined,
        emergencyName: emergencyName || undefined,
        emergencyPhone: emergencyPhone || undefined,
        emergencyRelationship: emergencyRelationship || undefined,
        // roleIds: selectedRoleIds.length > 0 ? selectedRoleIds : undefined,
        // roleDefinitionId: roleDefinitionId || undefined,
      });

      if (result.ok) {
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to create staff member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const selectedRoles = assignableRoles.filter((r) => selectedRoleIds.includes(r.id));
  const selectedRoleDef = staffRoleDefinitions.find((r) => r.id === roleDefinitionId);

  if (!open) return null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add New Staff Member"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ maxHeight: "90vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Dialog Header ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add New Staff Member</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                A login account will be created automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          {/* ── Stepper ───────────────────────────────────────────────────── */}
          <div className="flex items-center gap-0 border-b border-slate-100 px-6 py-4">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (step.id < currentStep) setCurrentStep(step.id);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      step.id === currentStep
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : step.id < currentStep
                        ? "cursor-pointer bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                        : "bg-slate-100 text-slate-400 cursor-default"
                    }`}
                  >
                    {step.id < currentStep ? "✓" : step.id}
                  </button>
                  <span
                    className={`hidden text-center text-[9px] font-semibold leading-tight sm:block ${
                      step.id === currentStep ? "text-indigo-600" : "text-slate-400"
                    }`}
                    style={{ maxWidth: "52px" }}
                  >
                    {step.label}
                  </span>
                </div>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`mb-4 h-px flex-1 transition-all ${
                      step.id < currentStep ? "bg-indigo-300" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* ── Scrollable Content ────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-6 py-6">

            {/* STEP 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold text-slate-900">Personal Information</h3>
                  <p className="mt-0.5 text-sm text-slate-500">Basic identity details for this staff member.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First Name" required>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. John" />
                  </Field>
                  <Field label="Last Name" required>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Doe" />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone" required>
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+256 700 000000" />
                  </Field>
                  <Field label="Email" required>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john.doe@school.ac.ug" />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Gender" required>
                    <Select value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </Select>
                  </Field>
                  <Field label="Date of Birth">
                    <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nationality">
                    <Input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g. Ugandan" />
                  </Field>
                  <Field label="National ID / Passport">
                    <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="CM900xxxxx" />
                  </Field>
                </div>

                <Field label="Residential Address">
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Plot 12, Kampala Road" />
                </Field>

                <Field label="Login Password" hint="If left blank, the phone number will be used as the initial password.">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to use phone number"
                    autoComplete="new-password"
                  />
                </Field>
              </div>
            )}

            {/* STEP 2: Employment */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold text-slate-900">Employment Details</h3>
                  <p className="mt-0.5 text-sm text-slate-500">Contract and HR information.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Staff Type" required>
                    <Select value={staffType} onChange={(e) => setStaffType(e.target.value as any)}>
                      <option value="TEACHING">Teaching</option>
                      <option value="NON_TEACHING">Non-Teaching</option>
                      <option value="SUPPORT">Support</option>
                    </Select>
                  </Field>
                  <Field label="Employment Type" required>
                    <Select value={employmentType} onChange={(e) => setEmploymentType(e.target.value as any)}>
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="VOLUNTEER">Volunteer</option>
                    </Select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Date of Hire" required>
                    <Input type="date" value={dateOfHire} onChange={(e) => setDateOfHire(e.target.value)} />
                  </Field>
                  <Field label="Basic Salary (UGX)">
                    <Input type="number" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} placeholder="e.g. 1500000" min="0" />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Highest Qualification">
                    <Select value={highestQualification} onChange={(e) => setHighestQualification(e.target.value)}>
                      <option value="">Select qualification</option>
                      <option value="Certificate">Certificate</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Post-Graduate Diploma">Post-Graduate Diploma</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="PhD">PhD</option>
                    </Select>
                  </Field>
                  <Field label="Specialization / Subject">
                    <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Mathematics" />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="NSSF Number">
                    <Input value={nssfNumber} onChange={(e) => setNssfNumber(e.target.value)} placeholder="e.g. 1000xxxxx" />
                  </Field>
                  <Field label="TIN Number">
                    <Input value={tinNumber} onChange={(e) => setTinNumber(e.target.value)} placeholder="e.g. 1000xxxxx" />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Bank Name">
                    <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Stanbic Bank" />
                  </Field>
                  <Field label="Bank Account Number">
                    <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="e.g. 9030xxxxx" />
                  </Field>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Emergency Contact</p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Full Name">
                      <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} placeholder="Contact name" />
                    </Field>
                    <Field label="Phone">
                      <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder="+256 7xx xxxxxx" />
                    </Field>
                    <Field label="Relationship">
                      <Input value={emergencyRelationship} onChange={(e) => setEmergencyRelationship(e.target.value)} placeholder="e.g. Spouse" />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: System Access */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold text-slate-900">System Access &amp; Roles</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Choose what this staff member can access in the system.
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">System Roles</p>
                    {selectedRoles.length > 0 && (
                      <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                        {selectedRoles.length} selected
                      </span>
                    )}
                  </div>
                  <p className="mb-3 text-xs text-slate-500">
                    Select all roles that apply. These control which dashboards and features are accessible.
                  </p>

                  {assignableRoles.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                      <p className="text-sm text-slate-400">No roles found. Roles are created by an administrator.</p>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {assignableRoles.map((role) => (
                        <RoleChip
                          key={role.id}
                          role={role}
                          selected={selectedRoleIds.includes(role.id)}
                          onClick={() => toggleRole(role.id)}
                        />
                      ))}
                    </div>
                  )}

                  {selectedRoleIds.length === 0 && (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-xs text-amber-700">
                        ⚠ No role selected. The account will default to basic &ldquo;user&rdquo; access. You can update roles later.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-1 text-sm font-semibold text-slate-700">Job Role / Title</p>
                  <p className="mb-2 text-xs text-slate-500">
                    The staff member&apos;s job title within this school (e.g. Class Teacher, HOD).
                  </p>
                  <Select value={roleDefinitionId} onChange={(e) => setRoleDefinitionId(e.target.value)}>
                    <option value="">— No job role assigned yet —</option>
                    {staffRoleDefinitions.map((def) => (
                      <option key={def.id} value={def.id}>
                        [{def.code}] {def.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {(selectedRoles.length > 0 || roleDefinitionId) && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-500">Access summary</p>
                    {selectedRoles.length > 0 && (
                      <p className="text-sm text-indigo-800">
                        <span className="font-medium">System access:</span>{" "}
                        {selectedRoles.map((r) => r.displayName || r.roleName).join(", ")}
                      </p>
                    )}
                    {selectedRoleDef && (
                      <p className="mt-1 text-sm text-indigo-800">
                        <span className="font-medium">Job title:</span> {selectedRoleDef.name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold text-slate-900">Review &amp; Confirm</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Please review the information before creating the staff account.
                  </p>
                </div>

                <ReviewSection title="Personal Info">
                  <ReviewRow label="Name" value={`${firstName} ${lastName}`} />
                  <ReviewRow label="Phone" value={phone} />
                  <ReviewRow label="Email" value={email} />
                  <ReviewRow label="Gender" value={gender} />
                  {dob && <ReviewRow label="Date of Birth" value={dob} />}
                  {nationalId && <ReviewRow label="National ID" value={nationalId} />}
                  {address && <ReviewRow label="Address" value={address} />}
                  <ReviewRow
                    label="Login Password"
                    value={password ? "Custom password set" : `Phone number (${phone})`}
                    muted
                  />
                </ReviewSection>

                <ReviewSection title="Employment">
                  <ReviewRow label="Staff Type" value={staffType.replace("_", " ")} />
                  <ReviewRow label="Employment Type" value={employmentType.replace("_", " ")} />
                  <ReviewRow label="Date of Hire" value={dateOfHire} />
                  {basicSalary && (
                    <ReviewRow label="Basic Salary" value={`UGX ${Number(basicSalary).toLocaleString()}`} />
                  )}
                  {highestQualification && <ReviewRow label="Qualification" value={highestQualification} />}
                  {specialization && <ReviewRow label="Specialization" value={specialization} />}
                </ReviewSection>

                <ReviewSection title="System Access">
                  <ReviewRow
                    label="System Roles"
                    value={
                      selectedRoles.length > 0
                        ? selectedRoles.map((r) => r.displayName || r.roleName).join(", ")
                        : "Default user role (basic access)"
                    }
                    muted={selectedRoles.length === 0}
                  />
                  <ReviewRow
                    label="Job Role / Title"
                    value={selectedRoleDef?.name ?? "Not assigned"}
                    muted={!selectedRoleDef}
                  />
                </ReviewSection>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-800">✅ A login account will be created</p>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    The staff member can log in with <strong>{email || phone}</strong> and the{" "}
                    {password ? "custom" : "phone-number"} password.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-sm font-medium text-rose-700">❌ {error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Dialog Footer (Navigation) ───────────────────────────────── */}
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={goBack}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                ← Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => !isSubmitting && onClose()}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                Step {currentStep} of {STEPS.length}
              </span>

              {/* NEXT — steps 1–3 only */}
              {currentStep < STEPS.length && (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue →
                </button>
              )}

              {/* SUBMIT — step 4 only */}
              {currentStep === STEPS.length && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating…
                    </>
                  ) : (
                    "✓ Create Staff Member"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}