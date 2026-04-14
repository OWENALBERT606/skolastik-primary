"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Plus, Search, X, Eye, Edit2,
  UserCheck, GraduationCap, Phone, Mail,
  MoreVertical, RefreshCw, Shield, Clock, AlertCircle,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import { getStaff, createStaff, updateStaffStatus } from "@/actions/staff-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type StaffStatus =
  | "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "RESIGNED"
  | "TERMINATED" | "RETIRED" | "CONTRACT_ENDED";
type StaffType = "TEACHING" | "NON_TEACHING";
type EmploymentType = "PERMANENT" | "CONTRACT" | "PART_TIME" | "VOLUNTEER" | "INTERN";
type SortKey = "name" | "staffId" | "staffType" | "status" | "dateOfHire";
type SortDir = "asc" | "desc";

export interface StaffMember {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  gender: string;
  staffType: StaffType;
  employmentType: EmploymentType;
  status: StaffStatus;
  basicSalary: number;
  salaryGrade?: string | null;
  dateOfHire: string | Date;
  imageUrl?: string | null;
  highestQualification?: string | null;
  roles: Array<{
    isPrimary: boolean;
    roleDefinition: { name: string; code: string };
  }>;
}

export interface RoleDefinition {
  id: string;
  name: string;
  code: string;
}

// ─── Style Maps ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:         "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  ON_LEAVE:       "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  SUSPENDED:      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  RESIGNED:       "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  TERMINATED:     "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  RETIRED:        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  CONTRACT_ENDED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
};

const TYPE_STYLES: Record<string, string> = {
  TEACHING:     "bg-violet-100 text-violet-700 border-violet-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
  NON_TEACHING: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20",
};

// ─── Shared Styles ────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-1 " +
  "bg-white border border-blue-200 text-blue-900 placeholder-blue-300 " +
  "focus:border-blue-500 focus:ring-blue-300/30 " +
  "dark:bg-[#0f172a] dark:border-slate-700/60 dark:text-slate-200 dark:placeholder-slate-500 " +
  "dark:focus:border-[#6366f1] dark:focus:ring-[#6366f1]/30";

const labelCls =
  "block text-xs font-medium mb-1.5 uppercase tracking-wider text-blue-500 dark:text-slate-400";

const thCls =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider select-none " +
  "text-blue-500 dark:text-slate-400";

const thSortCls =
  thCls + " cursor-pointer hover:text-blue-700 dark:hover:text-slate-200 transition-colors";

// ─── Add Staff Modal ──────────────────────────────────────────────────────────

const EMPTY_FORM = {
  firstName: "", lastName: "", phone: "", email: "", gender: "Male",
  staffType: "NON_TEACHING" as StaffType,
  employmentType: "PERMANENT" as EmploymentType,
  dateOfHire: new Date().toISOString().split("T")[0],
  basicSalary: "", salaryGrade: "",
  highestQualification: "", specialization: "",
  nssfNumber: "", tinNumber: "",
  bankName: "", bankAccount: "",
  emergencyName: "", emergencyPhone: "",
  roleDefinitionId: "", address: "", nationalId: "",
};

const STEPS = ["Personal", "Employment", "Emergency & Bank"] as const;

function AddStaffModal({ open, onClose, schoolId, roles, onSuccess }: {
  open: boolean; onClose: () => void; schoolId: string;
  roles: RoleDefinition[]; onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const set = (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const reset = () => { setForm(EMPTY_FORM); setStep(1); setError(""); };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone) {
      setError("First name, last name and phone are required.");
      return;
    }
    setLoading(true); setError("");
    try {
      await createStaff({ schoolId, ...form, basicSalary: parseFloat(form.basicSalary) || 0, dateOfHire: new Date(form.dateOfHire) });
      onSuccess(); onClose(); reset();
    } catch (err: any) {
      setError(err.message ?? "Failed to create staff member.");
    } finally { setLoading(false); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { onClose(); reset(); }} />
      <div className="relative rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl bg-white border border-blue-100 dark:bg-[#0d1117] dark:border-slate-700/50">
        <div className="flex items-center justify-between px-6 py-5 border-b border-blue-100 dark:border-slate-700/50">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-blue-900 dark:text-white">Add Staff Member</h2>
            <p className="text-xs mt-0.5 text-blue-400 dark:text-slate-500">Step {step} of {STEPS.length}</p>
          </div>
          <button onClick={() => { onClose(); reset(); }} className="text-blue-300 hover:text-blue-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex px-6 pt-5 gap-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${step > i + 1 ? "bg-blue-600 text-white dark:bg-[#6366f1]" : step === i + 1 ? "bg-blue-600 text-white ring-4 ring-blue-300/40 dark:bg-[#6366f1] dark:ring-[#6366f1]/25" : "bg-blue-100 text-blue-400 dark:bg-slate-800 dark:text-slate-500"}`}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`text-xs hidden sm:block truncate ${step === i + 1 ? "text-blue-700 dark:text-slate-300" : "text-blue-300 dark:text-slate-600"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 transition-all ${step > i + 1 ? "bg-blue-500 dark:bg-[#6366f1]" : "bg-blue-100 dark:bg-slate-800"}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 overflow-y-auto max-h-[52vh] space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm bg-red-50 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400">
                <AlertCircle size={15} className="shrink-0" /> {error}
              </div>
            )}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>First Name *</label><input className={inputCls} value={form.firstName} onChange={set("firstName")} placeholder="John" /></div>
                  <div><label className={labelCls}>Last Name *</label><input className={inputCls} value={form.lastName} onChange={set("lastName")} placeholder="Doe" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Phone *</label><input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="+256 700 000000" /></div>
                  <div><label className={labelCls}>Email</label><input className={inputCls} type="email" value={form.email} onChange={set("email")} placeholder="john@school.ac.ug" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Gender</label><select className={inputCls} value={form.gender} onChange={set("gender")}><option>Male</option><option>Female</option></select></div>
                  <div><label className={labelCls}>National ID</label><input className={inputCls} value={form.nationalId} onChange={set("nationalId")} placeholder="CM..." /></div>
                </div>
                <div><label className={labelCls}>Highest Qualification</label><input className={inputCls} value={form.highestQualification} onChange={set("highestQualification")} placeholder="e.g. Bachelor of Education" /></div>
                <div><label className={labelCls}>Specialization</label><input className={inputCls} value={form.specialization} onChange={set("specialization")} placeholder="e.g. Mathematics & Physics" /></div>
                <div><label className={labelCls}>Address</label><input className={inputCls} value={form.address} onChange={set("address")} placeholder="P.O. Box / Physical Address" /></div>
              </>
            )}
            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Staff Type *</label><select className={inputCls} value={form.staffType} onChange={set("staffType")}><option value="TEACHING">Teaching</option><option value="NON_TEACHING">Non-Teaching</option></select></div>
                  <div><label className={labelCls}>Employment Type *</label><select className={inputCls} value={form.employmentType} onChange={set("employmentType")}><option value="PERMANENT">Permanent</option><option value="CONTRACT">Contract</option><option value="PART_TIME">Part-Time</option><option value="VOLUNTEER">Volunteer</option><option value="INTERN">Intern</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Date of Hire *</label><input type="date" className={inputCls} value={form.dateOfHire} onChange={set("dateOfHire")} /></div>
                  <div><label className={labelCls}>Salary Grade</label><input className={inputCls} value={form.salaryGrade} onChange={set("salaryGrade")} placeholder="e.g. U4, T3" /></div>
                </div>
                <div><label className={labelCls}>Basic Salary (UGX)</label><input type="number" className={inputCls} value={form.basicSalary} onChange={set("basicSalary")} placeholder="0" min={0} /></div>
                {roles.length > 0 && (
                  <div><label className={labelCls}>Initial Role</label><select className={inputCls} value={form.roleDefinitionId} onChange={set("roleDefinitionId")}><option value="">— Select role —</option>{roles.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}</select></div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>NSSF Number</label><input className={inputCls} value={form.nssfNumber} onChange={set("nssfNumber")} placeholder="NSSF-..." /></div>
                  <div><label className={labelCls}>TIN Number</label><input className={inputCls} value={form.tinNumber} onChange={set("tinNumber")} placeholder="TIN-..." /></div>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <p className="text-xs uppercase tracking-wider font-semibold text-blue-400 dark:text-slate-500">Emergency Contact</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Contact Name</label><input className={inputCls} value={form.emergencyName} onChange={set("emergencyName")} placeholder="Jane Doe" /></div>
                  <div><label className={labelCls}>Contact Phone</label><input className={inputCls} value={form.emergencyPhone} onChange={set("emergencyPhone")} placeholder="+256 ..." /></div>
                </div>
                <div className="border-t pt-4 mt-2 border-blue-100 dark:border-slate-700/50">
                  <p className="text-xs uppercase tracking-wider font-semibold mb-3 text-blue-400 dark:text-slate-500">Bank Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelCls}>Bank Name</label><input className={inputCls} value={form.bankName} onChange={set("bankName")} placeholder="e.g. Stanbic Bank" /></div>
                    <div><label className={labelCls}>Account Number</label><input className={inputCls} value={form.bankAccount} onChange={set("bankAccount")} placeholder="9140..." /></div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-blue-100 bg-blue-50/50 dark:border-slate-700/50 dark:bg-slate-900/30">
            <button type="button" onClick={() => step > 1 ? setStep(s => s - 1) : (onClose(), reset())} className="px-4 py-2 text-sm text-blue-500 hover:text-blue-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
              {step > 1 ? "← Back" : "Cancel"}
            </button>
            {step < STEPS.length ? (
              <button type="button" onClick={() => setStep(s => s + 1)} className="px-5 py-2 text-white text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e3] transition-colors">Continue →</button>
            ) : (
              <button type="submit" disabled={loading} className="px-5 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e3] transition-colors">
                {loading && <RefreshCw size={14} className="animate-spin" />} Create Staff Member
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Status Modal ─────────────────────────────────────────────────────────────

function StatusModal({ staff, onClose, onSuccess }: {
  staff: StaffMember | null; onClose: () => void; onSuccess: () => void;
}) {
  const [status, setStatus] = useState<StaffStatus>("ACTIVE");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (staff) setStatus(staff.status); }, [staff]);

  async function handleSave() {
    if (!staff) return;
    setLoading(true);
    try { await updateStaffStatus(staff.id, status, reason); onSuccess(); onClose(); setReason(""); }
    finally { setLoading(false); }
  }

  if (!staff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-2xl w-full max-w-sm shadow-2xl bg-white border border-blue-100 dark:bg-[#0d1117] dark:border-slate-700/50">
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100 dark:border-slate-700/50">
          <h3 className="font-semibold text-sm text-blue-900 dark:text-white">Update Status</h3>
          <button onClick={onClose}><X size={18} className="text-blue-300 dark:text-slate-500" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-slate-800/40">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-blue-100 text-blue-600 dark:bg-[#6366f1]/20 dark:text-[#6366f1]">
              {staff.firstName[0]}{staff.lastName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-900 dark:text-white truncate">{staff.firstName} {staff.lastName}</p>
              <p className="text-xs text-blue-400 dark:text-slate-500">{staff.staffId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-500">Current:</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[staff.status] ?? ""}`}>{staff.status.replace(/_/g, " ")}</span>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1.5 text-blue-500 dark:text-slate-400">New Status</label>
            <select className={inputCls} value={status} onChange={e => setStatus(e.target.value as StaffStatus)}>
              {(["ACTIVE","ON_LEAVE","SUSPENDED","RESIGNED","TERMINATED","RETIRED","CONTRACT_ENDED"] as StaffStatus[]).map(s => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1.5 text-blue-500 dark:text-slate-400">Reason (optional)</label>
            <textarea className={inputCls} rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for status change..." />
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg text-blue-500 bg-blue-50 hover:bg-blue-100 dark:text-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2 text-sm text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e3] transition-colors">
            {loading && <RefreshCw size={12} className="animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={12} className="text-blue-300 dark:text-slate-600" />;
  return sortDir === "asc"
    ? <ChevronUp size={12} className="text-blue-600 dark:text-[#6366f1]" />
    : <ChevronDown size={12} className="text-blue-600 dark:text-[#6366f1]" />;
}

// ─── Row Menu ─────────────────────────────────────────────────────────────────

function RowMenu({ staff, onViewDetail, onStatusChange }: {
  staff: StaffMember; onViewDetail: () => void; onStatusChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg transition-colors text-blue-300 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-600 dark:hover:text-slate-400 dark:hover:bg-slate-800">
        <MoreVertical size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 border rounded-xl shadow-xl py-1 w-44 bg-white border-blue-100 dark:bg-[#161b22] dark:border-slate-700/60">
            <button onClick={() => { onViewDetail(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors">
              <Eye size={13} /> View Full Profile
            </button>
            <button onClick={() => { onStatusChange(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors">
              <Edit2 size={13} /> Change Status
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

export default function StaffList({
  schoolId, initialStaff, roles,
}: {
  schoolId: string; initialStaff: StaffMember[]; roles: RoleDefinition[];
}) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<StaffMember | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const total    = staff.length;
  const active   = staff.filter(s => s.status === "ACTIVE").length;
  const teaching = staff.filter(s => s.staffType === "TEACHING" && s.status === "ACTIVE").length;
  const onLeave  = staff.filter(s => s.status === "ON_LEAVE").length;

  async function load(opts?: { status?: string; type?: string; q?: string }) {
    setLoading(true);
    const data = await getStaff(schoolId, {
      status: (opts?.status ?? filterStatus) as any || undefined,
      staffType: (opts?.type ?? filterType) as any || undefined,
      search: (opts?.q ?? search) || undefined,
    });
    setStaff(data as any);
    setPage(1);
    setLoading(false);
  }

  useEffect(() => { if (filterStatus !== "" || filterType !== "") load(); }, [filterStatus, filterType]);
  useEffect(() => {
    const t = setTimeout(() => { load({ q: search }); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sorted = [...staff].sort((a, b) => {
    let av: any, bv: any;
    if      (sortKey === "name")      { av = `${a.firstName} ${a.lastName}`;  bv = `${b.firstName} ${b.lastName}`; }
    else if (sortKey === "staffId")   { av = a.staffId;   bv = b.staffId; }
    else if (sortKey === "staffType") { av = a.staffType; bv = b.staffType; }
    else if (sortKey === "status")    { av = a.status;    bv = b.status; }
    else if (sortKey === "dateOfHire"){ av = new Date(a.dateOfHire); bv = new Date(b.dateOfHire); }
    else return 0;
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const STAT_CARDS = [
    { label: "Total Staff",       value: total,    icon: Users,         color: "text-blue-500 dark:text-slate-400",    bg: "bg-blue-100 dark:bg-slate-800/50" },
    { label: "Active",            value: active,   icon: UserCheck,     color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { label: "Teaching (Active)", value: teaching, icon: GraduationCap, color: "text-violet-600 dark:text-indigo-400",   bg: "bg-violet-100 dark:bg-indigo-500/10" },
    { label: "On Leave",          value: onLeave,  icon: Clock,         color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-500/10" },
  ];

  return (
    <div className="relative px-6 pb-12 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between pt-10 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-[#6366f1]/20 dark:text-[#6366f1]">
            <Users size={16} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-blue-900 dark:text-white">Staff Directory</h2>
            <p className="text-xs text-blue-400 dark:text-slate-500">All school employees and their records</p>
          </div>
        </div>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl shadow-lg bg-blue-600 hover:bg-blue-700 shadow-blue-300/30 dark:bg-[#6366f1] dark:hover:bg-[#5558e3] dark:shadow-[#6366f1]/20 transition-all">
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {STAT_CARDS.map(stat => (
          <div key={stat.label} className="border rounded-xl p-4 flex items-center gap-3 bg-white border-blue-100 shadow-sm dark:bg-[#0d1117] dark:border-slate-800/80">
            <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center shrink-0`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-blue-400 dark:text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400 dark:text-slate-500 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, staff ID, phone..."
            className="w-full border rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none transition-all bg-white border-blue-200 text-blue-900 placeholder-blue-300 focus:border-blue-400 shadow-sm dark:bg-[#0d1117] dark:border-slate-800 dark:text-slate-200 dark:placeholder-slate-600 dark:focus:border-[#6366f1]/50" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 dark:text-slate-600 hover:text-blue-600"><X size={14} /></button>}
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white border-blue-200 text-blue-700 shadow-sm dark:bg-[#0d1117] dark:border-slate-800 dark:text-slate-300 transition-all">
          <option value="">All Statuses</option>
          {(["ACTIVE","ON_LEAVE","SUSPENDED","RESIGNED","TERMINATED","RETIRED","CONTRACT_ENDED"] as StaffStatus[]).map(s => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white border-blue-200 text-blue-700 shadow-sm dark:bg-[#0d1117] dark:border-slate-800 dark:text-slate-300 transition-all">
          <option value="">All Types</option>
          <option value="TEACHING">Teaching</option>
          <option value="NON_TEACHING">Non-Teaching</option>
        </select>
        <button onClick={() => load()} title="Refresh" className="p-2.5 border rounded-xl bg-white border-blue-200 text-blue-400 hover:text-blue-600 hover:border-blue-300 shadow-sm dark:bg-[#0d1117] dark:border-slate-800 dark:text-slate-500 dark:hover:text-slate-300 transition-all">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {!loading && staff.length > 0 && (
        <p className="text-xs text-blue-400 dark:text-slate-500 mb-3">
          Showing {paged.length} of {staff.length} staff member{staff.length !== 1 ? "s" : ""}
          {(filterStatus || filterType || search) && " (filtered)"}
        </p>
      )}

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden shadow-sm bg-white border-blue-100 dark:bg-[#0d1117] dark:border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-blue-50/70 border-blue-100 dark:bg-slate-900/60 dark:border-slate-800">
                <th className={thSortCls} onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-1.5">Name <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} /></div>
                </th>
                <th className={thSortCls} onClick={() => handleSort("staffId")}>
                  <div className="flex items-center gap-1.5">Staff ID <SortIcon col="staffId" sortKey={sortKey} sortDir={sortDir} /></div>
                </th>
                <th className={`${thCls} hidden md:table-cell`}>Contact</th>
                <th className={thSortCls} onClick={() => handleSort("staffType")}>
                  <div className="flex items-center gap-1.5">Type <SortIcon col="staffType" sortKey={sortKey} sortDir={sortDir} /></div>
                </th>
                <th className={thSortCls} onClick={() => handleSort("status")}>
                  <div className="flex items-center gap-1.5">Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} /></div>
                </th>
                <th className={`${thSortCls} hidden lg:table-cell`} onClick={() => handleSort("dateOfHire")}>
                  <div className="flex items-center gap-1.5">Hired <SortIcon col="dateOfHire" sortKey={sortKey} sortDir={sortDir} /></div>
                </th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>

            <tbody className="divide-y divide-blue-50 dark:divide-slate-800/60">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-slate-800 shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-2.5 w-28 rounded bg-blue-100 dark:bg-slate-800" />
                          <div className="h-2 w-16 rounded bg-blue-50 dark:bg-slate-800/60" />
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-2.5 w-20 rounded bg-blue-50 dark:bg-slate-800/60" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-blue-100 text-blue-300 dark:bg-slate-800/50 dark:text-slate-600">
                        <Users size={24} />
                      </div>
                      <p className="font-medium text-blue-700 dark:text-slate-400">No staff found</p>
                      <p className="text-xs mt-1 text-blue-400 dark:text-slate-600">Try adjusting your filters or add a new staff member</p>
                      <button onClick={() => setAddOpen(true)} className="mt-5 px-4 py-2 text-white text-sm rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e3] transition-colors">
                        Add First Staff Member
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map(s => {
                  const hireDate = new Date(s.dateOfHire);
                  return (
                    <tr key={s.id} className="group transition-colors hover:bg-blue-50/50 dark:hover:bg-slate-800/30">

                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          {s.imageUrl ? (
                            <img src={s.imageUrl} className="w-8 h-8 rounded-full object-cover ring-1 ring-blue-200 dark:ring-slate-700 shrink-0" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gradient-to-br from-blue-100 to-violet-100 text-blue-600 dark:from-[#6366f1]/20 dark:to-[#8b5cf6]/20 dark:text-[#a5b4fc]">
                              {s.firstName[0]}{s.lastName[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                           <button onClick={() => router.push(`/school/${schoolId}/staff/${s.id}`)}
                            className="text-sm font-medium text-blue-900 dark:text-white hover:text-blue-600 dark:hover:text-[#6366f1] transition-colors truncate block text-left max-w-[160px]">
                            {s.firstName} {s.lastName}
                            </button>
                            <p className="text-xs text-blue-300 dark:text-slate-600">{s.gender}</p>
                          </div>
                        </div>
                      </td>

                      {/* Staff ID */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-blue-500 dark:text-slate-400 bg-blue-50 dark:bg-slate-800/60 px-2 py-0.5 rounded-md">
                          {s.staffId}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-blue-500 dark:text-slate-400">
                            <Phone size={10} className="shrink-0" />
                            <span className="truncate max-w-[130px]">{s.phone}</span>
                          </div>
                          {s.email && (
                            <div className="flex items-center gap-1.5 text-xs text-blue-400 dark:text-slate-500">
                              <Mail size={10} className="shrink-0" />
                              <span className="truncate max-w-[130px]">{s.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TYPE_STYLES[s.staffType] ?? ""}`}>
                          {s.staffType === "TEACHING" ? "Teaching" : "Non-Teaching"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[s.status] ?? ""}`}>
                          {s.status.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Date hired */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-blue-400 dark:text-slate-500">
                          {hireDate.toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3.5">
                        <RowMenu
                          staff={s}
                          onViewDetail={() => router.push(`/school/${schoolId}/staff/${s.id}`)}
                          onStatusChange={() => setStatusTarget(s)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-blue-100 bg-blue-50/40 dark:border-slate-800 dark:bg-slate-900/30">
            <p className="text-xs text-blue-400 dark:text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-blue-200 text-blue-600 hover:bg-blue-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = totalPages <= 5 ? i + 1
                  : page <= 3 ? i + 1
                  : page >= totalPages - 2 ? totalPages - 4 + i
                  : page - 2 + i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-8 h-7 text-xs rounded-lg border transition-colors ${page === pg ? "border-blue-500 bg-blue-600 text-white dark:border-[#6366f1] dark:bg-[#6366f1]" : "border-blue-200 text-blue-600 hover:bg-blue-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"}`}>
                    {pg}
                  </button>
                );
              })}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-blue-200 text-blue-600 hover:bg-blue-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      <AddStaffModal open={addOpen} onClose={() => setAddOpen(false)} schoolId={schoolId} roles={roles} onSuccess={() => load()} />
      <StatusModal staff={statusTarget} onClose={() => setStatusTarget(null)} onSuccess={() => load()} />
    </div>
  );
}