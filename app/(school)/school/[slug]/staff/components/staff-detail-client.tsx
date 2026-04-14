"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, FileText, Clock, AlertTriangle,
  DollarSign, Edit2, Plus, X, RefreshCw,
  Phone, Mail, MapPin, Calendar, Shield, CreditCard,
  Download, AlertCircle, CheckCircle, Star, Circle
} from "lucide-react";
import {
  getStaffById, updateStaff, getStaffContracts, createStaffContract,
  activateContract, getEmploymentHistory, getLeaveRequests, getLeaveBalances,
  createLeaveRequest, getStaffDocuments, uploadStaffDocument, getStaffPayrollHistory,
  getDisciplinaryRecords, createDisciplinaryRecord, getAppraisals, getAppraisalCycles,
  initiateSelfAppraisal, submitSelfAppraisal, submitManagerReview,
  getSalaryAdvances, createSalaryAdvance, getStaffLoans, createStaffLoan
} from "@/actions/staff-actions";
import {
  getRoleDefinitions, assignRoleToStaff, removeRoleFromStaff, setPrimaryRole,
  getStaffTeacherRecord, getSchoolStreamSubjectsForAssignment, seedDefaultRoleDefinitions
} from "@/actions/staff-role";
import { assignTeacherToStreamSubject, removeTeacherFromStreamSubject } from "@/actions/stream-subjects";
import type { AppraisalRating } from "@prisma/client";
import { BookOpen, Briefcase } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LeaveType = "ANNUAL"|"SICK"|"MATERNITY"|"PATERNITY"|"COMPASSIONATE"|"STUDY"|"UNPAID"|"OTHER";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  ON_LEAVE:  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  SUSPENDED: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  RESIGNED:  "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  TERMINATED:"bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  PENDING:   "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  APPROVED:  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  PAID:      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  DRAFT:     "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  REJECTED:  "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  OPEN:      "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  DISBURSED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
};

const TABS = [
  { id:"overview",     label:"Overview",        icon:User },
  { id:"roles",        label:"Roles",           icon:Shield },
  { id:"teaching",     label:"Teaching",        icon:BookOpen, teachingOnly: true },
  { id:"contracts",    label:"Contracts",       icon:FileText },
  { id:"leave",        label:"Leave",           icon:Calendar },
  { id:"payroll",      label:"Payroll",         icon:DollarSign },
  { id:"documents",    label:"Documents",       icon:FileText },
  { id:"disciplinary", label:"Disciplinary",    icon:AlertTriangle },
  { id:"appraisals",   label:"Appraisals",      icon:Star },
  { id:"loans",        label:"Loans & Advances",icon:CreditCard },
  { id:"history",      label:"History",         icon:Clock },
];

// ─── Shared style constants ───────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-1 " +
  "bg-white border border-gray-200 text-black placeholder-gray-400 " +
  "focus:border-blue-500 focus:ring-blue-200/40 " +
  "dark:bg-[#0f172a] dark:border-slate-700/60 dark:text-slate-200 dark:placeholder-slate-500 " +
  "dark:focus:border-[#6366f1] dark:focus:ring-[#6366f1]/20";

const labelCls =
  "block text-xs font-medium mb-1.5 uppercase tracking-wider " +
  "text-gray-500 dark:text-slate-400";

const cardCls =
  "rounded-xl p-4 border bg-white border-gray-200 " +
  "dark:bg-slate-800/40 dark:border-slate-700/40";

const sectionHeadingCls =
  "text-xs font-semibold uppercase tracking-wider mb-3 " +
  "text-gray-400 dark:text-slate-500";

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, open, onClose, children, width = "max-w-lg" }: {
  title: string; open: boolean; onClose: () => void;
  children: React.ReactNode; width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl border bg-white border-blue-100 dark:bg-[#0d1117] dark:border-slate-700/50`}>
        <div className="flex items-center justify-between px-6 py-5 border-b sticky top-0 z-10 border-blue-100 bg-white dark:border-slate-700/50 dark:bg-[#0d1117]">
          <h2 className="text-base font-semibold text-black dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-blue-300 hover:text-blue-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className={sectionHeadingCls}>{title}</h3>{children}</div>;
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">{children}</div>;
}

function InfoItem({ label, value, icon, mono }: { label: string; value?: any; icon?: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs mb-0.5 text-gray-400 dark:text-slate-500">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-gray-300 dark:text-slate-600">{icon}</span>}
        <p className={`text-sm ${mono ? "font-mono text-blue-600 dark:text-[#a5b4fc]" : "text-blue-900 dark:text-slate-200"}`}>
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gray-100 dark:bg-slate-800/50">
        <Icon size={20} className="text-gray-300 dark:text-slate-600" />
      </div>
      <p className="text-sm text-gray-400 dark:text-slate-500">{message}</p>
    </div>
  );
}

function ErrBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg p-3 text-xs bg-red-50 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
      <AlertCircle size={14} /> {msg}
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

const EDIT_SECTIONS = ["Personal", "Contact", "Employment", "Qualifications", "Banking", "Statutory", "Emergency"] as const;
type EditSection = typeof EDIT_SECTIONS[number];

function OverviewTab({ staff, onEditSuccess }: { staff: any; onEditSuccess: () => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const [editSection, setEditSection] = useState<EditSection>("Personal");
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  function openEdit() {
    setErr(""); setEditSection("Personal");
    setForm({
      firstName: staff.firstName ?? "", lastName: staff.lastName ?? "",
      gender: staff.gender ?? "", dob: staff.dob ? new Date(staff.dob).toISOString().split("T")[0] : "",
      nationality: staff.nationality ?? "", nationalId: staff.nationalId ?? "",
      imageUrl: staff.imageUrl ?? "", phone: staff.phone ?? "",
      email: staff.email ?? "", address: staff.address ?? "",
      basicSalary: staff.basicSalary ?? "", salaryGrade: staff.salaryGrade ?? "",
      paymentMethod: staff.paymentMethod ?? "", highestQualification: staff.highestQualification ?? "",
      specialization: staff.specialization ?? "", bankName: staff.bankName ?? "",
      bankAccount: staff.bankAccount ?? "", bankBranch: staff.bankBranch ?? "",
      mobileMoneyPhone: staff.mobileMoneyPhone ?? "", nssfNumber: staff.nssfNumber ?? "",
      tinNumber: staff.tinNumber ?? "", emergencyName: staff.emergencyName ?? "",
      emergencyPhone: staff.emergencyPhone ?? "", emergencyRelationship: staff.emergencyRelationship ?? "",
    });
    setEditOpen(true);
  }

  async function handleSave() {
    setLoading(true); setErr("");
    try {
      const payload: any = { ...form };
      if (payload.basicSalary !== "") payload.basicSalary = parseFloat(payload.basicSalary);
      else delete payload.basicSalary;
      if (payload.dob) payload.dob = new Date(payload.dob); else delete payload.dob;
      Object.keys(payload).forEach(k => { if (payload[k] === "") payload[k] = undefined; });
      const res = await updateStaff(staff.id, payload);
      if (!res.ok) { setErr(res.message); return; }
      onEditSuccess(); setEditOpen(false);
    } finally { setLoading(false); }
  }

  const F2 = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  );
  const Field = ({ label, k, type = "text", placeholder = "" }: { label: string; k: string; type?: string; placeholder?: string }) => (
    <div><label className={labelCls}>{label}</label><input type={type} className={inputCls} value={form[k] ?? ""} onChange={set(k)} placeholder={placeholder} /></div>
  );
  const SelectField = ({ label, k, options }: { label: string; k: string; options: string[] }) => (
    <div>
      <label className={labelCls}>{label}</label>
      <select className={inputCls} value={form[k] ?? ""} onChange={set(k)}>
        <option value="">— Select —</option>
        {options.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={openEdit} className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-colors text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:text-slate-400 dark:bg-slate-800/50 dark:border-slate-700/50 dark:hover:bg-slate-700/50">
          <Edit2 size={12} /> Edit Profile
        </button>
      </div>
      <Section title="Personal Information">
        <Grid2>
          <InfoItem label="First Name" value={staff.firstName} />
          <InfoItem label="Last Name" value={staff.lastName} />
          <InfoItem label="Gender" value={staff.gender} />
          <InfoItem label="Date of Birth" value={staff.dob ? new Date(staff.dob).toLocaleDateString() : undefined} />
          <InfoItem label="Phone" value={staff.phone} icon={<Phone size={12} />} />
          <InfoItem label="Email" value={staff.email} icon={<Mail size={12} />} />
          <InfoItem label="National ID" value={staff.nationalId} />
          <InfoItem label="Nationality" value={staff.nationality} />
          <InfoItem label="Address" value={staff.address} icon={<MapPin size={12} />} />
        </Grid2>
      </Section>
      <Section title="Employment Details">
        <Grid2>
          <InfoItem label="Staff ID" value={staff.staffId} mono />
          <InfoItem label="Login ID" value={staff.user?.loginId} mono />
          <InfoItem label="Staff Type" value={staff.staffType} />
          <InfoItem label="Employment Type" value={staff.employmentType} />
          <InfoItem label="Date of Hire" value={staff.dateOfHire ? new Date(staff.dateOfHire).toLocaleDateString() : "—"} />
          <InfoItem label="Salary Grade" value={staff.salaryGrade} />
          <InfoItem label="Basic Salary" value={staff.basicSalary > 0 ? `UGX ${staff.basicSalary.toLocaleString()}` : "—"} />
          <InfoItem label="Payment Method" value={staff.paymentMethod} />
          <InfoItem label="NSSF Number" value={staff.nssfNumber} />
          <InfoItem label="TIN Number" value={staff.tinNumber} />
        </Grid2>
      </Section>
      <Section title="Qualifications">
        <Grid2>
          <InfoItem label="Highest Qualification" value={staff.highestQualification} />
          <InfoItem label="Specialization" value={staff.specialization} />
          <InfoItem label="Institution Attended" value={staff.institutionAttended} />
        </Grid2>
      </Section>
      <Section title="Banking Details">
        <Grid2>
          <InfoItem label="Bank Name" value={staff.bankName} />
          <InfoItem label="Account Number" value={staff.bankAccount} mono />
          <InfoItem label="Branch" value={staff.bankBranch} />
          <InfoItem label="Mobile Money" value={staff.mobileMoneyPhone} />
        </Grid2>
      </Section>
      <Section title="Emergency Contact">
        <Grid2>
          <InfoItem label="Name" value={staff.emergencyName} />
          <InfoItem label="Phone" value={staff.emergencyPhone} />
          <InfoItem label="Relationship" value={staff.emergencyRelationship} />
        </Grid2>
      </Section>
      {staff.roles?.length > 0 && (
        <Section title="Assigned Roles">
          <div className="space-y-2">
            {staff.roles.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <Shield size={13} className="text-blue-500 dark:text-[#6366f1]" />
                  <span className="text-sm text-black dark:text-slate-200">{r.roleDefinition.name}</span>
                  <span className="text-xs font-mono text-gray-400 dark:text-slate-500">{r.roleDefinition.code}</span>
                </div>
                {r.isPrimary && <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-100 text-blue-600 border-blue-200 dark:bg-[#6366f1]/15 dark:text-[#6366f1] dark:border-[#6366f1]/20">Primary</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Modal title="Edit Staff Profile" open={editOpen} onClose={() => setEditOpen(false)} width="max-w-2xl">
        <div className="sticky top-[65px] z-10 px-6 py-3 border-b flex gap-1.5 flex-wrap bg-white border-gray-100 dark:bg-[#0d1117] dark:border-slate-700/50">
          {EDIT_SECTIONS.map(s => (
            <button key={s} onClick={() => { setErr(""); setEditSection(s); }}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap transition-all ${editSection === s ? "bg-blue-600 text-white dark:bg-[#6366f1]" : "text-gray-500 hover:text-black hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="p-6 space-y-4 min-h-[340px]">
          {err && <ErrBanner msg={err} />}
          {editSection === "Personal" && (<><F2><Field label="First Name" k="firstName" /><Field label="Last Name" k="lastName" /></F2><F2><SelectField label="Gender" k="gender" options={["MALE","FEMALE","OTHER"]} /><Field label="Date of Birth" k="dob" type="date" /></F2><F2><Field label="Nationality" k="nationality" /><Field label="National ID" k="nationalId" /></F2><Field label="Profile Photo URL" k="imageUrl" placeholder="https://..." /></>)}
          {editSection === "Contact" && (<><F2><Field label="Phone" k="phone" /><Field label="Email" k="email" type="email" /></F2><div><label className={labelCls}>Address</label><textarea className={inputCls} rows={3} value={form.address ?? ""} onChange={e => setForm((f: any) => ({ ...f, address: e.target.value }))} /></div></>)}
          {editSection === "Employment" && (<><F2><Field label="Basic Salary (UGX)" k="basicSalary" type="number" /><Field label="Salary Grade" k="salaryGrade" /></F2><SelectField label="Payment Method" k="paymentMethod" options={["BANK_TRANSFER","MOBILE_MONEY","CASH","CHEQUE"]} /><div className="rounded-lg p-3 text-xs bg-gray-50 text-gray-500 dark:bg-slate-800/60 dark:text-slate-400">ℹ️ Staff Type, Employment Type, and Date of Hire are managed through Contracts.</div></>)}
          {editSection === "Qualifications" && (<><SelectField label="Highest Qualification" k="highestQualification" options={["CERTIFICATE","DIPLOMA","DEGREE","POST_GRADUATE_DIPLOMA","MASTERS","PHD","OTHER"]} /><F2><Field label="Specialization" k="specialization" /></F2></>)}
          {editSection === "Banking" && (<><F2><Field label="Bank Name" k="bankName" /><Field label="Account Number" k="bankAccount" /></F2><F2><Field label="Branch" k="bankBranch" /><Field label="Mobile Money Phone" k="mobileMoneyPhone" /></F2></>)}
          {editSection === "Statutory" && (<><F2><Field label="NSSF Number" k="nssfNumber" /><Field label="TIN Number" k="tinNumber" /></F2><div className="rounded-lg p-3 text-xs bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400">⚠️ Used in payroll and statutory filings — ensure accuracy.</div></>)}
          {editSection === "Emergency" && (<><F2><Field label="Contact Name" k="emergencyName" /><Field label="Contact Phone" k="emergencyPhone" /></F2><SelectField label="Relationship" k="emergencyRelationship" options={["SPOUSE","PARENT","SIBLING","CHILD","RELATIVE","FRIEND","OTHER"]} /></>)}
        </div>
        <div className="flex gap-3 px-6 pb-6 border-t pt-4 border-gray-100 dark:border-slate-700/50">
          <button onClick={() => setEditOpen(false)} className="flex-1 py-2.5 text-sm rounded-lg border transition-colors text-gray-600 bg-white border-gray-200 hover:bg-gray-50 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 text-sm text-white rounded-lg transition-colors flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e3]">
            {loading && <RefreshCw size={13} className="animate-spin" />} Save Changes
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Tab: Leave ───────────────────────────────────────────────────────────────

function LeaveTab({ staff, schoolId }: { staff: any; schoolId: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ leaveType: "ANNUAL" as LeaveType, startDate: "", endDate: "", daysRequested: "", reason: "" });
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function load() {
    const [req, bal] = await Promise.all([
      getLeaveRequests(schoolId, { staffId: staff.id }),
      getLeaveBalances(staff.id, new Date().getFullYear()),
    ]);
    setRequests(req as any[]); setBalances(bal as any[]);
  }
  useEffect(() => { load(); }, []);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      const res = await createLeaveRequest({ staffId: staff.id, schoolId, leaveType: form.leaveType, startDate: new Date(form.startDate), endDate: new Date(form.endDate), daysRequested: parseFloat(form.daysRequested), reason: form.reason });
      if (!res.ok) { setErr(res.message); return; }
      load(); setApplyOpen(false);
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3 text-blue-900 dark:text-white">Leave Balances ({new Date().getFullYear()})</h3>
        {balances.length === 0 ? <p className="text-sm italic text-blue-400 dark:text-slate-500">No leave balances configured.</p> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {balances.map((b: any) => (
              <div key={b.id} className={cardCls}>
                <p className="text-xs uppercase tracking-wider mb-2 text-gray-400 dark:text-slate-500">{b.leaveType.replace(/_/g," ")}</p>
                <div className="flex items-end gap-2"><span className="text-2xl font-bold text-black dark:text-white">{b.remaining}</span><span className="text-xs mb-1 text-blue-400 dark:text-slate-500">/ {b.entitled} days</span></div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700"><div className="h-full rounded-full bg-blue-500 dark:bg-[#6366f1]" style={{ width: `${b.entitled > 0 ? (b.remaining / b.entitled) * 100 : 0}%` }} /></div>
                {b.used > 0 && <p className="text-xs mt-1 text-gray-400 dark:text-slate-600">{b.used} used</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-black dark:text-white">Leave Requests</h3>
          <button onClick={() => { setErr(""); setApplyOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:text-[#6366f1] dark:bg-[#6366f1]/10 dark:border-[#6366f1]/20 dark:hover:bg-[#6366f1]/20"><Plus size={12} /> Apply Leave</button>
        </div>
        {requests.length === 0 ? <EmptyState icon={Calendar} message="No leave requests" /> : (
          <div className="space-y-2">
            {requests.map((r: any) => (
              <div key={r.id} className={`flex items-center justify-between p-4 ${cardCls}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1"><span className="text-sm font-medium text-black dark:text-white">{r.leaveType.replace(/_/g," ")}</span><span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[r.status] ?? ""}`}>{r.status}</span></div>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()} · {r.daysRequested} day{r.daysRequested !== 1 ? "s" : ""}</p>
                </div>
                {r.approvedBy && <p className="text-xs text-gray-400 dark:text-slate-600">By: {r.approvedBy.name}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal title="Apply for Leave" open={applyOpen} onClose={() => setApplyOpen(false)}>
        <form onSubmit={handleApply} className="p-6 space-y-4">
          {err && <ErrBanner msg={err} />}
          <div><label className={labelCls}>Leave Type</label><select className={inputCls} value={form.leaveType} onChange={set("leaveType")}>{["ANNUAL","SICK","MATERNITY","PATERNITY","COMPASSIONATE","STUDY","UNPAID","OTHER"].map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4"><div><label className={labelCls}>Start Date</label><input type="date" className={inputCls} value={form.startDate} onChange={set("startDate")} required /></div><div><label className={labelCls}>End Date</label><input type="date" className={inputCls} value={form.endDate} onChange={set("endDate")} required /></div></div>
          <div><label className={labelCls}>Days Requested</label><input type="number" className={inputCls} value={form.daysRequested} onChange={set("daysRequested")} min="0.5" step="0.5" required /></div>
          <div><label className={labelCls}>Reason</label><textarea className={inputCls} rows={3} value={form.reason} onChange={set("reason")} required /></div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setApplyOpen(false)} className="flex-1 py-2.5 text-sm rounded-lg transition-colors text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 text-sm text-white rounded-lg flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e3]">{loading && <RefreshCw size={13} className="animate-spin" />} Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Tab: Payroll ─────────────────────────────────────────────────────────────

function PayrollTab({ staff }: { staff: any }) {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  useEffect(() => { getStaffPayrollHistory(staff.id).then(d => setPayrolls(d as any[])); }, []);
  const total12 = payrolls.slice(0, 12).reduce((s, p) => s + (p.netSalary ?? 0), 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[{ label:"Latest Net Pay", value: payrolls[0]?.netSalary ? `UGX ${Number(payrolls[0].netSalary).toLocaleString()}` : "—" }, { label:"Basic Salary", value:`UGX ${staff.basicSalary.toLocaleString()}` }, { label:"12-Month Total", value: total12 > 0 ? `UGX ${total12.toLocaleString()}` : "—" }].map(s => (
          <div key={s.label} className={cardCls}><p className="text-xs mb-1 text-blue-400 dark:text-slate-500">{s.label}</p><p className="text-lg font-bold text-black dark:text-white">{s.value}</p></div>
        ))}
      </div>
      {payrolls.length === 0 ? <EmptyState icon={DollarSign} message="No payroll records yet" /> : (
        <div className="space-y-2">
          {payrolls.map((p: any) => (
            <div key={p.id} className={`p-4 ${cardCls}`}>
              <div className="flex items-center justify-between mb-3">
                <div><p className="text-sm font-semibold text-black dark:text-white">{p.payPeriod}</p><span className={`text-xs px-2 py-0.5 rounded-full border mt-1 inline-block ${STATUS_STYLES[p.status] ?? ""}`}>{p.status}</span></div>
                <div className="text-right"><p className="text-lg font-bold text-black dark:text-white">UGX {Number(p.netSalary).toLocaleString()}</p><p className="text-xs text-gray-400 dark:text-slate-500">Net Pay</p></div>
              </div>
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="text-center"><p className="text-gray-400 dark:text-slate-500">Basic</p><p className="font-medium text-gray-700 dark:text-slate-300">{(Number(p.basicSalary)/1000).toFixed(0)}K</p></div>
                <div className="text-center"><p className="text-gray-400 dark:text-slate-500">Allowances</p><p className="font-medium text-emerald-600 dark:text-emerald-400">+{(Number(p.totalAllowances)/1000).toFixed(0)}K</p></div>
                <div className="text-center"><p className="text-gray-400 dark:text-slate-500">Deductions</p><p className="font-medium text-red-600 dark:text-red-400">-{(Number(p.totalDeductions)/1000).toFixed(0)}K</p></div>
                <div className="text-center"><p className="text-gray-400 dark:text-slate-500">PAYE</p><p className="font-medium text-orange-600 dark:text-orange-400">-{(Number(p.payeAmount)/1000).toFixed(0)}K</p></div>
              </div>
              {p.payslips?.length > 0 && <div className="mt-3 pt-3 border-t flex justify-end border-blue-100 dark:border-slate-700/40"><a href={p.payslips[0].fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 dark:text-[#6366f1] dark:hover:text-[#818cf8] transition-colors"><Download size={12} /> Download Payslip</a></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Documents ───────────────────────────────────────────────────────────

function DocumentsTab({ staff, schoolId }: { staff: any; schoolId: string }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ category: "NATIONAL_ID", name: "", description: "", fileUrl: "", expiryDate: "" });
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));
  async function load() { setDocs((await getStaffDocuments(staff.id)) as any[]); }
  useEffect(() => { load(); }, []);
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      const res = await uploadStaffDocument({ staffId: staff.id, schoolId, ...form, category: form.category as any, expiryDate: form.expiryDate ? new Date(form.expiryDate) : undefined });
      if (!res.ok) { setErr(res.message); return; }
      load(); setUploadOpen(false);
    } finally { setLoading(false); }
  }
  const ICONS: Record<string, string> = { NATIONAL_ID:"🪪", CONTRACT:"📋", ACADEMIC_CERTIFICATE:"🎓", MEDICAL_CERTIFICATE:"🏥", PROFESSIONAL_CERTIFICATE:"🏅", APPOINTMENT_LETTER:"✉️", OTHER:"📄" };
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button onClick={() => { setErr(""); setUploadOpen(true); }} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:text-[#6366f1] dark:bg-[#6366f1]/10 dark:border-[#6366f1]/20 dark:hover:bg-[#6366f1]/20"><Plus size={12} /> Upload Document</button></div>
      {docs.length === 0 ? <EmptyState icon={FileText} message="No documents uploaded" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {docs.map((d: any) => (
            <div key={d.id} className={`p-4 rounded-xl border group ${cardCls}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3"><span className="text-2xl">{ICONS[d.category] ?? "📄"}</span><div><p className="text-sm font-medium text-black dark:text-white">{d.name}</p><p className="text-xs text-gray-400 dark:text-slate-500">{d.category.replace(/_/g," ")}</p></div></div>
                <div className="flex items-center gap-2">{d.isVerified && <CheckCircle size={14} className="text-emerald-500 dark:text-emerald-400" />}{d.expiryDate && new Date(d.expiryDate) < new Date(Date.now() + 30*24*60*60*1000) && <AlertCircle size={14} className="text-amber-500 dark:text-amber-400" />}</div>
              </div>
              {d.expiryDate && <p className="text-xs mt-2 text-gray-400 dark:text-slate-600">Expires: {new Date(d.expiryDate).toLocaleDateString()}</p>}
              <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><a href={d.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-[#6366f1] dark:hover:text-[#818cf8]"><Download size={11} /> View</a></div>
            </div>
          ))}
        </div>
      )}
      <Modal title="Upload Document" open={uploadOpen} onClose={() => setUploadOpen(false)}>
        <form onSubmit={handleUpload} className="p-6 space-y-4">
          {err && <ErrBanner msg={err} />}
          <div><label className={labelCls}>Category</label><select className={inputCls} value={form.category} onChange={set("category")}>{["NATIONAL_ID","CONTRACT","ACADEMIC_CERTIFICATE","PROFESSIONAL_CERTIFICATE","MEDICAL_CERTIFICATE","APPOINTMENT_LETTER","WARNING_LETTER","APPRAISAL_REPORT","RECOMMENDATION_LETTER","OTHER"].map(c => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}</select></div>
          <div><label className={labelCls}>Document Name</label><input className={inputCls} value={form.name} onChange={set("name")} required /></div>
          <div><label className={labelCls}>File URL</label><input className={inputCls} value={form.fileUrl} onChange={set("fileUrl")} placeholder="https://..." required /></div>
          <div><label className={labelCls}>Expiry Date (optional)</label><input type="date" className={inputCls} value={form.expiryDate} onChange={set("expiryDate")} /></div>
          <div><label className={labelCls}>Description</label><textarea className={inputCls} rows={2} value={form.description} onChange={set("description")} /></div>
          <div className="flex gap-3"><button type="button" onClick={() => setUploadOpen(false)} className="flex-1 py-2.5 text-sm rounded-lg transition-colors text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700">Cancel</button><button type="submit" disabled={loading} className="flex-1 py-2.5 text-sm text-white rounded-lg flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e3]">{loading && <RefreshCw size={13} className="animate-spin" />} Upload</button></div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Tab: Disciplinary ────────────────────────────────────────────────────────

function DisciplinaryTab({ staff, schoolId }: { staff: any; schoolId: string }) {
  const [records, setRecords] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ disciplinaryType: "VERBAL_WARNING", incidentDate: "", incidentDescription: "" });
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));
  async function load() { setRecords((await getDisciplinaryRecords(schoolId, { staffId: staff.id })) as any[]); }
  useEffect(() => { load(); }, []);
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      const res = await createDisciplinaryRecord({ staffId: staff.id, schoolId, issuedById: staff.id, disciplinaryType: form.disciplinaryType as any, incidentDate: new Date(form.incidentDate), incidentDescription: form.incidentDescription });
      if (!res.ok) { setErr(res.message); return; }
      load(); setAddOpen(false);
    } finally { setLoading(false); }
  }
  const TYPE_COLORS: Record<string, string> = { VERBAL_WARNING:"text-amber-600 dark:text-amber-400", WRITTEN_WARNING:"text-orange-600 dark:text-orange-400", FINAL_WARNING:"text-red-600 dark:text-red-400", SUSPENSION:"text-red-700 dark:text-red-500", TERMINATION:"text-red-800 dark:text-red-600", OTHER:"text-slate-500 dark:text-slate-400" };
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button onClick={() => { setErr(""); setAddOpen(true); }} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors text-red-600 bg-red-50 border-red-200 hover:bg-red-100 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20 dark:hover:bg-red-500/20"><Plus size={12} /> Record Incident</button></div>
      {records.length === 0 ? <EmptyState icon={AlertTriangle} message="No disciplinary records" /> : (
        <div className="space-y-3">
          {records.map((r: any) => (
            <div key={r.id} className={`p-4 ${cardCls}`}>
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><AlertTriangle size={14} className={TYPE_COLORS[r.disciplinaryType] ?? "text-slate-400"} /><span className="text-sm font-medium text-black dark:text-white">{r.disciplinaryType.replace(/_/g," ")}</span><span className="text-xs font-mono text-gray-400 dark:text-slate-500">{r.caseNumber}</span></div><span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[r.status] ?? ""}`}>{r.status}</span></div>
              <p className="text-xs text-gray-600 dark:text-slate-400">{r.incidentDescription}</p>
              <p className="text-xs mt-2 text-gray-400 dark:text-slate-600">{new Date(r.incidentDate).toLocaleDateString()}</p>
              {r.issuedBy && <p className="text-xs mt-1 text-gray-400 dark:text-slate-600">By: {r.issuedBy.firstName} {r.issuedBy.lastName}</p>}
            </div>
          ))}
        </div>
      )}
      <Modal title="Record Disciplinary Incident" open={addOpen} onClose={() => setAddOpen(false)}>
        <form onSubmit={handleAdd} className="p-6 space-y-4">
          {err && <ErrBanner msg={err} />}
          <div><label className={labelCls}>Type</label><select className={inputCls} value={form.disciplinaryType} onChange={set("disciplinaryType")}>{["VERBAL_WARNING","WRITTEN_WARNING","FINAL_WARNING","SUSPENSION","DEMOTION","TERMINATION","OTHER"].map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}</select></div>
          <div><label className={labelCls}>Incident Date</label><input type="date" className={inputCls} value={form.incidentDate} onChange={set("incidentDate")} required /></div>
          <div><label className={labelCls}>Description</label><textarea className={inputCls} rows={4} value={form.incidentDescription} onChange={set("incidentDescription")} required /></div>
          <div className="flex gap-3"><button type="button" onClick={() => setAddOpen(false)} className="flex-1 py-2.5 text-sm rounded-lg transition-colors text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700">Cancel</button><button type="submit" disabled={loading} className="flex-1 py-2.5 text-sm text-white rounded-lg flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700">{loading && <RefreshCw size={13} className="animate-spin" />} Record</button></div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Tab: Loans & Advances ────────────────────────────────────────────────────

function LoansTab({ staff, schoolId }: { staff: any; schoolId: string }) {
  const [advances, setAdvances] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [loanOpen, setLoanOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [advForm, setAdvForm] = useState({ amountRequested:"", reason:"", recoveryStartMonth: new Date().getMonth()+2 <= 12 ? new Date().getMonth()+2 : 1, recoveryStartYear: new Date().getFullYear(), monthlyRecovery:"" });
  const [loanForm, setLoanForm] = useState({ principalAmount:"", interestRate:"0", tenureMonths:"6", purpose:"", guarantorName:"", guarantorPhone:"" });
  async function load() {
    const [adv, ln] = await Promise.all([getSalaryAdvances(schoolId, { staffId: staff.id }), getStaffLoans(schoolId, { staffId: staff.id })]);
    setAdvances(adv as any[]); setLoans(ln as any[]);
  }
  useEffect(() => { load(); }, []);
  async function handleAdvance(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      const res = await createSalaryAdvance({ staffId: staff.id, schoolId, amountRequested: parseFloat(advForm.amountRequested), reason: advForm.reason, recoveryStartMonth: Number(advForm.recoveryStartMonth), recoveryStartYear: Number(advForm.recoveryStartYear), monthlyRecovery: parseFloat(advForm.monthlyRecovery) });
      if (!res.ok) { setErr(res.message); return; }
      load(); setAdvanceOpen(false);
    } finally { setLoading(false); }
  }
  async function handleLoan(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      const res = await createStaffLoan({ staffId: staff.id, schoolId, principalAmount: parseFloat(loanForm.principalAmount), interestRate: parseFloat(loanForm.interestRate), tenureMonths: parseInt(loanForm.tenureMonths), purpose: loanForm.purpose, guarantorName: loanForm.guarantorName, guarantorPhone: loanForm.guarantorPhone });
      if (!res.ok) { setErr(res.message); return; }
      load(); setLoanOpen(false);
    } finally { setLoading(false); }
  }
  const aBtn = "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:text-[#6366f1] dark:bg-[#6366f1]/10 dark:border-[#6366f1]/20 dark:hover:bg-[#6366f1]/20";
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-black dark:text-white">Salary Advances</h3><button onClick={() => { setErr(""); setAdvanceOpen(true); }} className={aBtn}><Plus size={12} /> Request Advance</button></div>
        {advances.length === 0 ? <EmptyState icon={CreditCard} message="No salary advances" /> : (
          <div className="space-y-2">{advances.map((a: any) => (<div key={a.id} className={`flex items-center justify-between p-4 ${cardCls}`}><div><p className="text-sm font-medium text-black dark:text-white">UGX {Number(a.amountRequested).toLocaleString()}</p><p className="text-xs font-mono text-gray-400 dark:text-slate-500">{a.advanceNumber}</p></div><div className="text-right"><span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[a.status] ?? ""}`}>{a.status}</span><p className="text-xs mt-1 text-gray-400 dark:text-slate-600">Recovered: UGX {Number(a.amountRecovered ?? 0).toLocaleString()}</p></div></div>))}</div>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-black dark:text-white">Staff Loans</h3><button onClick={() => { setErr(""); setLoanOpen(true); }} className={aBtn}><Plus size={12} /> Apply for Loan</button></div>
        {loans.length === 0 ? <EmptyState icon={DollarSign} message="No loan records" /> : (
          <div className="space-y-2">{loans.map((l: any) => (<div key={l.id} className={`p-4 ${cardCls}`}><div className="flex items-center justify-between mb-2"><p className="text-sm font-semibold text-black dark:text-white">UGX {Number(l.principalAmount).toLocaleString()}</p><span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[l.status] ?? ""}`}>{l.status}</span></div><div className="grid grid-cols-3 gap-3 text-xs"><div><p className="text-blue-400 dark:text-slate-500">Monthly</p><p className="text-blue-700 dark:text-slate-300">{l.monthlyInstalment ? `UGX ${Number(l.monthlyInstalment).toLocaleString()}` : "—"}</p></div><div><p className="text-blue-400 dark:text-slate-500">Outstanding</p><p className="text-amber-600 dark:text-amber-400">UGX {Number(l.outstandingBalance ?? 0).toLocaleString()}</p></div><div><p className="text-blue-400 dark:text-slate-500">Tenure</p><p className="text-blue-700 dark:text-slate-300">{l.tenureMonths} months</p></div></div><div className="mt-2 h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${l.totalRepayable > 0 ? ((l.totalRepaid ?? 0) / l.totalRepayable) * 100 : 0}%` }} /></div></div>))}</div>
        )}
      </div>
      <Modal title="Request Salary Advance" open={advanceOpen} onClose={() => setAdvanceOpen(false)}>
        <form onSubmit={handleAdvance} className="p-6 space-y-4">
          {err && <ErrBanner msg={err} />}
          <div><label className={labelCls}>Amount (UGX)</label><input type="number" className={inputCls} value={advForm.amountRequested} onChange={e => setAdvForm(f => ({ ...f, amountRequested: e.target.value }))} required /></div>
          <div className="grid grid-cols-2 gap-4"><div><label className={labelCls}>Recovery Month</label><select className={inputCls} value={advForm.recoveryStartMonth} onChange={e => setAdvForm(f => ({ ...f, recoveryStartMonth: Number(e.target.value) }))}>{Array.from({length:12},(_,i) => <option key={i+1} value={i+1}>{new Date(2000,i).toLocaleString("default",{month:"long"})}</option>)}</select></div><div><label className={labelCls}>Recovery Year</label><input type="number" className={inputCls} value={advForm.recoveryStartYear} onChange={e => setAdvForm(f => ({ ...f, recoveryStartYear: Number(e.target.value) }))} /></div></div>
          <div><label className={labelCls}>Monthly Recovery (UGX)</label><input type="number" className={inputCls} value={advForm.monthlyRecovery} onChange={e => setAdvForm(f => ({ ...f, monthlyRecovery: e.target.value }))} required /></div>
          <div><label className={labelCls}>Reason</label><textarea className={inputCls} rows={3} value={advForm.reason} onChange={e => setAdvForm(f => ({ ...f, reason: e.target.value }))} required /></div>
          <div className="flex gap-3"><button type="button" onClick={() => setAdvanceOpen(false)} className="flex-1 py-2.5 text-sm rounded-lg transition-colors text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700">Cancel</button><button type="submit" disabled={loading} className="flex-1 py-2.5 text-sm text-white rounded-lg flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e3]">{loading && <RefreshCw size={13} className="animate-spin" />} Submit</button></div>
        </form>
      </Modal>
      <Modal title="Apply for Staff Loan" open={loanOpen} onClose={() => setLoanOpen(false)}>
        <form onSubmit={handleLoan} className="p-6 space-y-4">
          {err && <ErrBanner msg={err} />}
          <div><label className={labelCls}>Principal Amount (UGX)</label><input type="number" className={inputCls} value={loanForm.principalAmount} onChange={e => setLoanForm(f => ({ ...f, principalAmount: e.target.value }))} required /></div>
          <div className="grid grid-cols-2 gap-4"><div><label className={labelCls}>Interest Rate (%/yr)</label><input type="number" className={inputCls} value={loanForm.interestRate} onChange={e => setLoanForm(f => ({ ...f, interestRate: e.target.value }))} /></div><div><label className={labelCls}>Tenure (months)</label><input type="number" className={inputCls} value={loanForm.tenureMonths} onChange={e => setLoanForm(f => ({ ...f, tenureMonths: e.target.value }))} /></div></div>
          <div className="grid grid-cols-2 gap-4"><div><label className={labelCls}>Guarantor Name</label><input className={inputCls} value={loanForm.guarantorName} onChange={e => setLoanForm(f => ({ ...f, guarantorName: e.target.value }))} /></div><div><label className={labelCls}>Guarantor Phone</label><input className={inputCls} value={loanForm.guarantorPhone} onChange={e => setLoanForm(f => ({ ...f, guarantorPhone: e.target.value }))} /></div></div>
          <div><label className={labelCls}>Purpose</label><textarea className={inputCls} rows={3} value={loanForm.purpose} onChange={e => setLoanForm(f => ({ ...f, purpose: e.target.value }))} required /></div>
          <div className="flex gap-3"><button type="button" onClick={() => setLoanOpen(false)} className="flex-1 py-2.5 text-sm rounded-lg transition-colors text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700">Cancel</button><button type="submit" disabled={loading} className="flex-1 py-2.5 text-sm text-white rounded-lg flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e3]">{loading && <RefreshCw size={13} className="animate-spin" />} Apply</button></div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Tab: History ─────────────────────────────────────────────────────────────

function HistoryTab({ staff }: { staff: any }) {
  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => { getEmploymentHistory(staff.id).then(d => setHistory(d as any[])); }, []);
  const EVENT_COLORS: Record<string, string> = { HIRED:"bg-emerald-500", PROMOTED:"bg-blue-500", SALARY_REVISED:"bg-blue-500", ROLE_CHANGED:"bg-indigo-500", STATUS_CHANGED:"bg-amber-500", TRANSFERRED:"bg-teal-500" };
  return (
    <div className="space-y-2">
      {history.length === 0 ? <EmptyState icon={Clock} message="No employment history" /> : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-blue-200 dark:bg-slate-700/50" />
          <div className="space-y-4">
            {history.map((h: any) => (
              <div key={h.id} className="flex gap-4 pl-2">
                <div className={`relative z-10 w-5 h-5 rounded-full flex-shrink-0 mt-0.5 ${EVENT_COLORS[h.eventType] ?? "bg-slate-400 dark:bg-slate-600"} ring-2 ring-white dark:ring-[#0d1117]`} />
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between"><div><p className="text-sm font-medium text-black dark:text-white">{h.eventType.replace(/_/g," ")}</p><p className="text-xs mt-0.5 text-gray-500 dark:text-slate-400">{h.description}</p></div><p className="text-xs shrink-0 ml-4 text-gray-400 dark:text-slate-600">{new Date(h.effectiveDate).toLocaleDateString()}</p></div>
                  {(h.previousValue || h.newValue) && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {h.previousValue && <div className="bg-red-50 border border-red-100 rounded-lg p-2 dark:bg-red-500/5 dark:border-red-500/15"><p className="text-xs mb-1 text-blue-300 dark:text-slate-600">Before</p>{Object.entries(h.previousValue as any).map(([k,v]) => <p key={k} className="text-xs text-gray-600 dark:text-slate-400"><span className="text-blue-400 dark:text-slate-500">{k}: </span>{String(v)}</p>)}</div>}
                      {h.newValue && <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 dark:bg-emerald-500/5 dark:border-emerald-500/15"><p className="text-xs mb-1 text-blue-300 dark:text-slate-600">After</p>{Object.entries(h.newValue as any).map(([k,v]) => <p key={k} className="text-xs text-gray-600 dark:text-slate-400"><span className="text-blue-400 dark:text-slate-500">{k}: </span>{String(v)}</p>)}</div>}
                    </div>
                  )}
                  {h.performedBy && <p className="text-xs mt-1 text-gray-400 dark:text-slate-600">By: {h.performedBy.name}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Contracts ───────────────────────────────────────────────────────────

function ContractsTab({ staff, schoolId }: { staff: any; schoolId: string }) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const blank = { contractType:"FIXED_TERM", title:"", startDate:"", endDate:"", probationEndDate:"", noticePeriodDays:"30", basicSalary:String(staff.basicSalary??""), salaryGrade:staff.salaryGrade??"", employmentType:staff.employmentType??"PERMANENT", jobDescription:"", termsAndConditions:"", workingHoursPerWeek:"40" };
  const [form, setForm] = useState(blank);
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const load = async () => { setLoading(true); try { setContracts((await getStaffContracts(staff.id) as any) ?? []); } catch { setContracts([]); } setLoading(false); };
  useEffect(() => { load(); }, []);
  const handleCreate = async () => {
    setSaving(true); setErr("");
    try {
      const res = await createStaffContract({ staffId:staff.id, schoolId, contractType:form.contractType as any, title:form.title, startDate:new Date(form.startDate), endDate:form.endDate?new Date(form.endDate):undefined, probationEndDate:form.probationEndDate?new Date(form.probationEndDate):undefined, noticePeriodDays:Number(form.noticePeriodDays), basicSalary:Number(form.basicSalary), salaryGrade:form.salaryGrade, employmentType:form.employmentType as any, jobDescription:form.jobDescription, termsAndConditions:form.termsAndConditions, workingHoursPerWeek:Number(form.workingHoursPerWeek) });
      if (!res.ok) { setErr(res.message); return; }
      setCreateOpen(false); setForm(blank); load();
    } catch (e: any) { setErr(e.message ?? "Failed to create contract"); }
    setSaving(false);
  };
  const handleActivate = async (id: string) => { try { await activateContract(id); load(); } catch {} };
  const CS: Record<string,string> = { DRAFT:"bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300", ACTIVE:"bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400", EXPIRED:"bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400", TERMINATED:"bg-red-100 text-red-800 dark:bg-red-700/15 dark:text-red-500", RENEWED:"bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" };
  const CTL: Record<string,string> = { PERMANENT:"Permanent", FIXED_TERM:"Fixed Term", PROBATION:"Probation", RENEWAL:"Renewal", AMENDMENT:"Amendment" };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><p className="text-xs text-gray-400 dark:text-slate-500">{contracts.length} contract{contracts.length!==1?"s":""} on record</p><button onClick={() => { setErr(""); setCreateOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e8]"><Plus size={13} /> New Contract</button></div>
      {loading ? <div className="space-y-3">{[...Array(2)].map((_,i) => <div key={i} className="h-28 rounded-xl animate-pulse bg-blue-100/60 dark:bg-slate-800/30" />)}</div> : contracts.length === 0 ? <EmptyState icon={FileText} message="No contracts on record" /> : (
        <div className="space-y-3">
          {contracts.map((c: any) => {
            const isActive = c.status === "ACTIVE";
            const isExpired = c.endDate && new Date(c.endDate) < new Date();
            const daysLeft = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) : null;
            return (
              <div key={c.id} className={`rounded-xl p-4 border transition-all bg-white dark:bg-slate-800/40 ${isActive ? "border-blue-200 dark:border-slate-700/60" : "border-blue-100/60 dark:border-slate-800/60"}`}>
                <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-emerald-100 dark:bg-emerald-500/10" : "bg-blue-100 dark:bg-slate-700/50"}`}><FileText size={18} className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-blue-400 dark:text-slate-500"} /></div><div className="min-w-0"><p className="text-sm font-medium truncate text-black dark:text-white">{c.title}</p><p className="text-xs mt-0.5 text-gray-400 dark:text-slate-500">{c.contractNumber} · {CTL[c.contractType]??c.contractType}</p></div></div><span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${CS[c.status]??"bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>{c.status}</span></div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">{[["Start Date",new Date(c.startDate).toLocaleDateString()],["End Date",c.endDate?new Date(c.endDate).toLocaleDateString():"Open-ended"],["Basic Salary",`UGX ${Number(c.basicSalary).toLocaleString()}`],["Employment",c.employmentType?.replace(/_/g," ")]].map(([l,v]) => (<div key={l}><p className="text-xs text-gray-400 dark:text-slate-600">{l}</p><p className={`text-xs mt-0.5 ${l==="End Date"&&isExpired?"text-red-600 dark:text-red-400":"text-gray-700 dark:text-slate-300"}`}>{v}</p></div>))}</div>
                <div className="mt-3 flex items-center gap-3">{[{signed:c.signedByStaff,label:"Staff signed",date:c.staffSignedAt},{signed:c.signedByAdmin,label:"Admin signed",date:c.adminSignedAt}].map(({signed,label,date}) => (<div key={label} className={`flex items-center gap-1 text-xs ${signed?"text-emerald-600 dark:text-emerald-400":"text-blue-300 dark:text-slate-500"}`}>{signed?<CheckCircle size={12}/>:<Circle size={12}/>}{label}{date?` · ${new Date(date).toLocaleDateString()}`:""}</div>))}</div>
                {isActive&&daysLeft!==null&&daysLeft<=60&&daysLeft>0&&<div className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20"><AlertCircle size={13} className="text-amber-600 dark:text-amber-400 shrink-0"/><p className="text-xs text-amber-700 dark:text-amber-300">Contract expires in {daysLeft} day{daysLeft!==1?"s":""}</p></div>}
                {isExpired&&c.status==="ACTIVE"&&<div className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20"><AlertCircle size={13} className="text-red-600 dark:text-red-400 shrink-0"/><p className="text-xs text-red-700 dark:text-red-300">Contract has expired — please renew or terminate</p></div>}
                <div className="mt-3 flex items-center gap-2"><button onClick={() => { setSelected(c); setViewOpen(true); }} className="text-xs text-blue-600 hover:text-blue-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">View Details</button>{c.status==="DRAFT"&&<button onClick={() => handleActivate(c.id)} className="text-xs ml-2 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">Activate</button>}{c.documentUrl&&<a href={c.documentUrl} target="_blank" rel="noreferrer" className="text-xs ml-2 flex items-center gap-1 transition-colors text-blue-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-slate-300"><Download size={11}/> PDF</a>}</div>
              </div>
            );
          })}
        </div>
      )}
      <Modal title="Contract Details" open={viewOpen} onClose={() => setViewOpen(false)} width="max-w-2xl">
        {selected && (<div className="p-6 space-y-4"><div className="grid grid-cols-2 gap-4">{[["Contract No.",selected.contractNumber],["Type",selected.contractType],["Status",selected.status],["Employment",selected.employmentType],["Start Date",new Date(selected.startDate).toLocaleDateString()],["End Date",selected.endDate?new Date(selected.endDate).toLocaleDateString():"Open-ended"],["Basic Salary",`UGX ${Number(selected.basicSalary).toLocaleString()}`],["Salary Grade",selected.salaryGrade??"—"],["Working Hours/wk",selected.workingHoursPerWeek??"—"],["Notice Period",`${selected.noticePeriodDays} days`]].map(([l,v]) => (<div key={l}><p className="text-xs text-gray-400 dark:text-slate-500">{l}</p><p className="text-sm mt-0.5 text-blue-900 dark:text-slate-200">{v}</p></div>))}</div>{selected.jobDescription&&<div><p className="text-xs mb-1 text-blue-400 dark:text-slate-500">Job Description</p><p className="text-sm rounded-lg p-3 whitespace-pre-wrap bg-gray-50 text-gray-800 dark:bg-slate-800/50 dark:text-slate-300">{selected.jobDescription}</p></div>}{selected.termsAndConditions&&<div><p className="text-xs mb-1 text-blue-400 dark:text-slate-500">Terms & Conditions</p><p className="text-sm rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap bg-gray-50 text-gray-800 dark:bg-slate-800/50 dark:text-slate-300">{selected.termsAndConditions}</p></div>}{selected.issuedBy&&<p className="text-xs text-gray-400 dark:text-slate-500">Issued by: {selected.issuedBy.name}</p>}</div>)}
      </Modal>
      <Modal title="Create New Contract" open={createOpen} onClose={() => setCreateOpen(false)} width="max-w-2xl">
        <div className="p-6 space-y-4">
          {err && <ErrBanner msg={err} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className={labelCls}>Contract Title *</label><input className={inputCls} value={form.title} onChange={set("title")} placeholder="e.g. Permanent Employment Contract" required /></div>
            <div><label className={labelCls}>Contract Type</label><select className={inputCls} value={form.contractType} onChange={set("contractType")}>{["PERMANENT","FIXED_TERM","PROBATION","RENEWAL","AMENDMENT"].map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}</select></div>
            <div><label className={labelCls}>Employment Type</label><select className={inputCls} value={form.employmentType} onChange={set("employmentType")}>{["PERMANENT","CONTRACT","PART_TIME","VOLUNTEER","INTERN"].map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}</select></div>
            <div><label className={labelCls}>Start Date *</label><input type="date" className={inputCls} value={form.startDate} onChange={set("startDate")} required /></div>
            <div><label className={labelCls}>End Date</label><input type="date" className={inputCls} value={form.endDate} onChange={set("endDate")} /></div>
            <div><label className={labelCls}>Probation End Date</label><input type="date" className={inputCls} value={form.probationEndDate} onChange={set("probationEndDate")} /></div>
            <div><label className={labelCls}>Notice Period (days)</label><input type="number" className={inputCls} value={form.noticePeriodDays} onChange={set("noticePeriodDays")} min={0} /></div>
            <div><label className={labelCls}>Basic Salary (UGX)</label><input type="number" className={inputCls} value={form.basicSalary} onChange={set("basicSalary")} min={0} /></div>
            <div><label className={labelCls}>Salary Grade</label><input className={inputCls} value={form.salaryGrade} onChange={set("salaryGrade")} placeholder="e.g. U4, T3" /></div>
            <div><label className={labelCls}>Working Hours / Week</label><input type="number" className={inputCls} value={form.workingHoursPerWeek} onChange={set("workingHoursPerWeek")} min={1} max={80} /></div>
          </div>
          <div><label className={labelCls}>Job Description</label><textarea className={inputCls} rows={3} value={form.jobDescription} onChange={set("jobDescription")} placeholder="Roles and responsibilities..." /></div>
          <div><label className={labelCls}>Terms & Conditions</label><textarea className={inputCls} rows={4} value={form.termsAndConditions} onChange={set("termsAndConditions")} placeholder="Employment terms, benefits, obligations..." /></div>
          <div className="flex justify-end gap-2 pt-2"><button onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm transition-colors text-blue-500 hover:text-blue-700 dark:text-slate-400 dark:hover:text-slate-200">Cancel</button><button onClick={handleCreate} disabled={saving||!form.title||!form.startDate} className="px-4 py-2 text-sm text-white rounded-lg font-medium transition-colors disabled:opacity-50 bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e8]">{saving?"Creating…":"Create Contract"}</button></div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Tab: Appraisals ──────────────────────────────────────────────────────────

function AppraisalsTab({ staff, schoolId }: { staff: any; schoolId: string }) {
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiateOpen, setInitiateOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [selfForm, setSelfForm] = useState({ selfScore:"", selfComments:"" });
  const [reviewForm, setReviewForm] = useState({ cycleId:"", reviewerId:"", teachingScore:"", adminScore:"", punctualityScore:"", initiativeScore:"", teamworkScore:"", overallScore:"", finalRating:"GOOD" as AppraisalRating, reviewerComments:"", strengthsNoted:"", areasForImprovement:"", developmentPlan:"" });
  const load = async () => { setLoading(true); try { const [a,c] = await Promise.all([getAppraisals(schoolId,undefined,{staffId:staff.id}) as Promise<any[]>, getAppraisalCycles(schoolId) as Promise<any[]>]); setAppraisals(a??[]); setCycles(c??[]); } catch { setAppraisals([]); setCycles([]); } setLoading(false); };
  useEffect(() => { load(); }, []);
  const handleSelfSubmit = async (id: string) => { setSaving(true); setErr(""); try { const res = await submitSelfAppraisal(id,{selfScore:Number(selfForm.selfScore),selfComments:selfForm.selfComments}); if(!res.ok){setErr(res.message);return;} setReviewOpen(false); load(); } catch(e:any){setErr(e.message??"Failed");} setSaving(false); };
  const handleInitiate = async () => { if(!reviewForm.cycleId){setErr("Please select a cycle");return;} setSaving(true); setErr(""); try { const res = await initiateSelfAppraisal({staffId:staff.id,schoolId,cycleId:reviewForm.cycleId,reviewerId:reviewForm.reviewerId||staff.id}); if(!res.ok){setErr(res.message);return;} setInitiateOpen(false); load(); } catch(e:any){setErr(e.message??"Failed");} setSaving(false); };
  const handleManagerReview = async (id: string) => { if(!reviewForm.overallScore||!reviewForm.reviewerComments){setErr("Overall score and comments required");return;} setSaving(true); setErr(""); try { const res = await submitManagerReview(id,{teachingScore:Number(reviewForm.teachingScore)||undefined,adminScore:Number(reviewForm.adminScore)||undefined,punctualityScore:Number(reviewForm.punctualityScore)||undefined,initiativeScore:Number(reviewForm.initiativeScore)||undefined,teamworkScore:Number(reviewForm.teamworkScore)||undefined,overallScore:Number(reviewForm.overallScore),finalRating:reviewForm.finalRating,reviewerComments:reviewForm.reviewerComments,strengthsNoted:reviewForm.strengthsNoted,areasForImprovement:reviewForm.areasForImprovement,developmentPlan:reviewForm.developmentPlan}); if(!res.ok){setErr(res.message);return;} setReviewOpen(false); load(); } catch(e:any){setErr(e.message??"Failed");} setSaving(false); };
  const RC: Record<string,string> = { EXCELLENT:"text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10", VERY_GOOD:"text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10", GOOD:"text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10", NEEDS_IMPROVEMENT:"text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10", UNSATISFACTORY:"text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/10" };
  const AS: Record<string,string> = { DRAFT:"bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400", SELF_REVIEW:"bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400", MANAGER_REVIEW:"bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400", MODERATION:"bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400", COMPLETED:"bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400", APPEALED:"bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" };
  const ScoreBar = ({ label, score }: { label: string; score?: number }) => (<div><div className="flex justify-between text-xs mb-1"><span className="text-blue-400 dark:text-slate-500">{label}</span><span className="text-blue-700 dark:text-slate-300">{score!=null?`${score}/5`:"—"}</span></div><div className="h-1.5 rounded-full overflow-hidden bg-blue-100 dark:bg-slate-700/60"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-400 dark:from-[#6366f1] dark:to-[#818cf8] transition-all" style={{width:score!=null?`${(score/5)*100}%`:"0%"}} /></div></div>);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><p className="text-xs text-gray-400 dark:text-slate-500">{appraisals.length} appraisal record{appraisals.length!==1?"s":""}</p><button onClick={() => { setErr(""); setInitiateOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e8]"><Plus size={13} /> Start Appraisal</button></div>
      {loading ? <div className="space-y-3">{[...Array(2)].map((_,i)=><div key={i} className="h-32 rounded-xl animate-pulse bg-blue-100/60 dark:bg-slate-800/30"/>)}</div> : appraisals.length===0 ? <EmptyState icon={Star} message="No appraisals on record" /> : (
        <div className="space-y-4">
          {appraisals.map((a:any) => (
            <div key={a.id} className={`rounded-xl p-4 border ${cardCls}`}>
              <div className="flex items-start justify-between gap-3 mb-3"><div><p className="text-sm font-medium text-black dark:text-white">{a.cycle?.name??"Appraisal"}</p><p className="text-xs mt-0.5 text-gray-400 dark:text-slate-500">{a.cycle?.year} · Reviewer: {a.reviewer?.firstName} {a.reviewer?.lastName}</p></div><div className="flex items-center gap-2 flex-shrink-0">{a.finalRating&&<span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RC[a.finalRating]??""}`}>{a.finalRating.replace(/_/g," ")}</span>}<span className={`text-xs font-medium px-2 py-0.5 rounded-full ${AS[a.status]??""}`}>{a.status.replace(/_/g," ")}</span></div></div>
              {(a.overallScore!=null||a.selfScore!=null)&&<div className="grid grid-cols-2 gap-4 mb-3">{a.selfScore!=null&&<div className="rounded-lg p-3 bg-blue-50 dark:bg-slate-700/30"><p className="text-xs mb-1 text-blue-400 dark:text-slate-500">Self Score</p><p className="text-2xl font-bold text-blue-600 dark:text-indigo-400">{a.selfScore}<span className="text-sm text-blue-300 dark:text-slate-500">/5</span></p></div>}{a.overallScore!=null&&<div className="rounded-lg p-3 bg-blue-50 dark:bg-slate-700/30"><p className="text-xs mb-1 text-blue-400 dark:text-slate-500">Overall Score</p><p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{Number(a.overallScore).toFixed(1)}<span className="text-sm text-blue-300 dark:text-slate-500">/5</span></p></div>}</div>}
              {(a.teachingScore!=null||a.adminScore!=null)&&<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">{a.teachingScore!=null&&<ScoreBar label="Teaching" score={a.teachingScore}/>}{a.adminScore!=null&&<ScoreBar label="Administration" score={a.adminScore}/>}{a.punctualityScore!=null&&<ScoreBar label="Punctuality" score={a.punctualityScore}/>}{a.initiativeScore!=null&&<ScoreBar label="Initiative" score={a.initiativeScore}/>}{a.teamworkScore!=null&&<ScoreBar label="Teamwork" score={a.teamworkScore}/>}</div>}
              {a.reviewerComments&&<div className="mt-2 rounded-lg p-3 bg-gray-50 dark:bg-slate-700/20"><p className="text-xs mb-1 text-blue-400 dark:text-slate-500">Reviewer Comments</p><p className="text-xs text-gray-700 dark:text-slate-300">{a.reviewerComments}</p></div>}
              {a.status==="COMPLETED"&&<div className={`mt-2 flex items-center gap-1.5 text-xs ${a.staffAcknowledged?"text-emerald-600 dark:text-emerald-400":"text-amber-600 dark:text-amber-400"}`}>{a.staffAcknowledged?<CheckCircle size={12}/>:<AlertCircle size={12}/>}{a.staffAcknowledged?`Staff acknowledged · ${new Date(a.staffAcknowledgedAt).toLocaleDateString()}`:"Awaiting staff acknowledgement"}</div>}
              <div className="mt-3 flex items-center gap-3 pt-2 border-t border-blue-100 dark:border-slate-700/40">{a.status==="SELF_REVIEW"&&<button onClick={() => { setSelected(a); setSelfForm({selfScore:"",selfComments:""}); setErr(""); setReviewOpen(true); }} className="text-xs text-blue-600 hover:text-blue-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">Submit Self Review</button>}{a.status==="MANAGER_REVIEW"&&<button onClick={() => { setSelected(a); setErr(""); setReviewOpen(true); }} className="text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition-colors">Submit Manager Review</button>}{a.isAppealed&&<span className="text-xs flex items-center gap-1 text-red-600 dark:text-red-400"><AlertCircle size={11}/> Under Appeal</span>}</div>
            </div>
          ))}
        </div>
      )}
      <Modal title="Start New Appraisal" open={initiateOpen} onClose={() => setInitiateOpen(false)}>
        <div className="p-6 space-y-4">
          {err && <ErrBanner msg={err} />}
          <div><label className={labelCls}>Appraisal Cycle *</label><select className={inputCls} value={reviewForm.cycleId} onChange={e => setReviewForm(f=>({...f,cycleId:e.target.value}))}><option value="">Select cycle…</option>{cycles.filter((c:any)=>c.isActive&&!c.isClosed).map((c:any)=><option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}</select>{cycles.filter((c:any)=>c.isActive&&!c.isClosed).length===0&&<p className="text-xs mt-1 text-amber-600 dark:text-amber-400">No active cycles. Create one in Settings first.</p>}</div>
          <div><label className={labelCls}>Reviewer Staff ID</label><input className={inputCls} value={reviewForm.reviewerId} onChange={e => setReviewForm(f=>({...f,reviewerId:e.target.value}))} placeholder="Enter reviewer's staff DB id" /><p className="text-xs mt-1 text-blue-400 dark:text-slate-500">The staff member who will conduct the review</p></div>
          <div className="rounded-lg p-3 text-xs space-y-1 bg-blue-50 dark:bg-slate-800/60"><p className="font-medium text-black dark:text-slate-300">What happens next:</p><p className="text-gray-500 dark:text-slate-400">1. Staff completes self-assessment</p><p className="text-gray-500 dark:text-slate-400">2. Reviewer submits score</p><p className="text-gray-500 dark:text-slate-400">3. Moderation → staff acknowledges</p></div>
          <div className="flex justify-end gap-2"><button onClick={() => setInitiateOpen(false)} className="px-4 py-2 text-sm transition-colors text-blue-500 hover:text-blue-700 dark:text-slate-400 dark:hover:text-slate-200">Cancel</button><button onClick={handleInitiate} disabled={saving||!reviewForm.cycleId} className="px-4 py-2 text-sm text-white rounded-lg font-medium transition-colors disabled:opacity-50 bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e8]">{saving?"Starting…":"Start Appraisal"}</button></div>
        </div>
      </Modal>
      <Modal title={selected?.status==="SELF_REVIEW"?"Self-Assessment":"Manager Review"} open={reviewOpen} onClose={() => setReviewOpen(false)} width="max-w-xl">
        {selected && (
          <div className="p-6 space-y-4">
            {err && <ErrBanner msg={err} />}
            {selected.status==="SELF_REVIEW" ? (
              <><div><label className={labelCls}>Self Score (1–5) *</label><input type="number" className={inputCls} min={1} max={5} step={0.1} value={selfForm.selfScore} onChange={e=>setSelfForm(f=>({...f,selfScore:e.target.value}))} placeholder="e.g. 4.0" /></div><div><label className={labelCls}>Self Comments *</label><textarea className={inputCls} rows={4} value={selfForm.selfComments} onChange={e=>setSelfForm(f=>({...f,selfComments:e.target.value}))} placeholder="Describe your performance..." /></div><div className="flex justify-end gap-2"><button onClick={()=>setReviewOpen(false)} className="px-4 py-2 text-sm transition-colors text-blue-500 hover:text-blue-700 dark:text-slate-400 dark:hover:text-slate-200">Cancel</button><button onClick={()=>handleSelfSubmit(selected.id)} disabled={saving||!selfForm.selfScore||!selfForm.selfComments} className="px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-50 bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e8]">{saving?"Submitting…":"Submit Self Review"}</button></div></>
            ) : (
              <><div className="grid grid-cols-2 gap-4">{[["teachingScore","Teaching (1–5)"],["adminScore","Admin (1–5)"],["punctualityScore","Punctuality (1–5)"],["initiativeScore","Initiative (1–5)"],["teamworkScore","Teamwork (1–5)"]].map(([k,l])=>(<div key={k}><label className={labelCls}>{l}</label><input type="number" className={inputCls} min={1} max={5} step={0.1} value={(reviewForm as any)[k]} onChange={e=>setReviewForm(f=>({...f,[k]:e.target.value}))} placeholder="1–5" /></div>))}</div><div className="grid grid-cols-2 gap-4"><div><label className={labelCls}>Overall Score (1–5) *</label><input type="number" className={inputCls} min={1} max={5} step={0.1} value={reviewForm.overallScore} onChange={e=>setReviewForm(f=>({...f,overallScore:e.target.value}))} placeholder="e.g. 4.2" /></div><div><label className={labelCls}>Final Rating *</label><select className={inputCls} value={reviewForm.finalRating} onChange={e=>setReviewForm(f=>({...f,finalRating:e.target.value as AppraisalRating}))}>{["EXCELLENT","VERY_GOOD","GOOD","NEEDS_IMPROVEMENT","UNSATISFACTORY"].map(r=><option key={r} value={r}>{r.replace(/_/g," ")}</option>)}</select></div></div><div><label className={labelCls}>Reviewer Comments *</label><textarea className={inputCls} rows={3} value={reviewForm.reviewerComments} onChange={e=>setReviewForm(f=>({...f,reviewerComments:e.target.value}))} placeholder="Overall assessment..." /></div><div><label className={labelCls}>Key Strengths</label><textarea className={inputCls} rows={2} value={reviewForm.strengthsNoted} onChange={e=>setReviewForm(f=>({...f,strengthsNoted:e.target.value}))} /></div><div><label className={labelCls}>Areas for Improvement</label><textarea className={inputCls} rows={2} value={reviewForm.areasForImprovement} onChange={e=>setReviewForm(f=>({...f,areasForImprovement:e.target.value}))} /></div><div><label className={labelCls}>Development Plan</label><textarea className={inputCls} rows={2} value={reviewForm.developmentPlan} onChange={e=>setReviewForm(f=>({...f,developmentPlan:e.target.value}))} /></div><div className="flex justify-end gap-2"><button onClick={()=>setReviewOpen(false)} className="px-4 py-2 text-sm transition-colors text-blue-500 hover:text-blue-700 dark:text-slate-400 dark:hover:text-slate-200">Cancel</button><button onClick={()=>handleManagerReview(selected.id)} disabled={saving||!reviewForm.reviewerComments||!reviewForm.overallScore} className="px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-50 bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e8]">{saving?"Submitting…":"Submit Review"}</button></div></>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Tab: Roles ───────────────────────────────────────────────────────────────

function RolesTab({ staff, schoolId, onRefresh }: { staff: any; schoolId: string; onRefresh: () => void }) {
  const [roles, setRoles] = useState<any[]>(staff.roles ?? []);
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [selectedDefId, setSelectedDefId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  async function loadDefs() {
    const res = await getRoleDefinitions(schoolId);
    let defs = res.data ?? [];
    
    // Automatically seed default roles if the school has none to prevent an empty dropdown
    if (defs.length === 0) {
      await seedDefaultRoleDefinitions(schoolId);
      const refresh = await getRoleDefinitions(schoolId);
      defs = refresh.data ?? [];
    }

    setDefinitions(defs);
  }

  useEffect(() => { loadDefs(); }, []);

  async function handleAssign() {
    if (!selectedDefId) { setErr("Please select a role"); return; }
    setLoading(true); setErr("");
    try {
      const res = await assignRoleToStaff({ staffId: staff.id, schoolId, roleDefinitionId: selectedDefId, isPrimary });
      if (!res.ok) { setErr(res.message); return; }
      onRefresh(); setAssignOpen(false); setSelectedDefId(""); setIsPrimary(false);
    } finally { setLoading(false); }
  }

  async function handleRemove(roleId: string) {
    if (!confirm("Remove this role from the staff member?")) return;
    const res = await removeRoleFromStaff(roleId);
    if (res.ok) onRefresh();
    else alert(res.message);
  }

  async function handleSetPrimary(roleId: string) {
    const res = await setPrimaryRole(roleId);
    if (res.ok) onRefresh();
    else alert(res.message);
  }

  const activeRoles = staff.roles?.filter((r: any) => r.isActive) ?? [];
  const assignedDefIds = new Set(activeRoles.map((r: any) => r.staffRoleDefinitionId));
  const availableDefs = definitions.filter((d: any) => !assignedDefIds.has(d.id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-slate-500">{activeRoles.length} role{activeRoles.length !== 1 ? "s" : ""} assigned</p>
        <button onClick={() => { setErr(""); setAssignOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:text-[#6366f1] dark:bg-[#6366f1]/10 dark:border-[#6366f1]/20 dark:hover:bg-[#6366f1]/20">
          <Plus size={12} /> Assign Role
        </button>
      </div>

      {activeRoles.length === 0 ? (
        <EmptyState icon={Shield} message="No roles assigned yet" />
      ) : (
        <div className="space-y-2">
          {activeRoles.map((r: any) => (
            <div key={r.id} className={`flex items-center justify-between p-4 rounded-xl border ${cardCls}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-[#6366f1]/15">
                  <Shield size={15} className="text-blue-600 dark:text-[#6366f1]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-black dark:text-slate-200">{r.roleDefinition.name}</span>
                    <span className="text-xs font-mono text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{r.roleDefinition.code}</span>
                    {r.isPrimary && (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-100 text-blue-600 border-blue-200 dark:bg-[#6366f1]/15 dark:text-[#6366f1] dark:border-[#6366f1]/20">Primary</span>
                    )}
                  </div>
                  {r.roleDefinition.description && (
                    <p className="text-xs mt-0.5 text-gray-400 dark:text-slate-500">{r.roleDefinition.description}</p>
                  )}
                  {r.roleDefinition.dashboardPath && (
                    <p className="text-xs mt-0.5 font-mono text-blue-400 dark:text-slate-600">{r.roleDefinition.dashboardPath}</p>
                  )}
                  <p className="text-xs mt-0.5 text-gray-300 dark:text-slate-600">
                    Assigned {r.assignedDate ? new Date(r.assignedDate).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!r.isPrimary && (
                  <button onClick={() => handleSetPrimary(r.id)}
                    className="text-xs px-2.5 py-1 rounded-lg border transition-colors text-gray-500 border-gray-200 hover:text-blue-600 hover:border-blue-300 dark:text-slate-500 dark:border-slate-700 dark:hover:text-[#6366f1] dark:hover:border-[#6366f1]/40">
                    Set Primary
                  </button>
                )}
                <button onClick={() => handleRemove(r.id)}
                  className="text-xs px-2.5 py-1 rounded-lg border transition-colors text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/10">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl p-4 border bg-blue-50/60 border-blue-100 dark:bg-slate-800/30 dark:border-slate-700/40">
        <p className="text-xs font-medium mb-1 text-blue-700 dark:text-slate-300">About Roles</p>
        <p className="text-xs text-blue-500 dark:text-slate-500">Roles control which dashboard a staff member can access when they log in. The primary role determines the default dashboard. A staff member can have multiple roles (e.g. Teacher + DOS).</p>
      </div>

      <Modal title="Assign Role" open={assignOpen} onClose={() => setAssignOpen(false)}>
        <div className="p-6 space-y-4">
          {err && <ErrBanner msg={err} />}
          <div>
            <label className={labelCls}>Role *</label>
            <select className={inputCls} value={selectedDefId} onChange={e => setSelectedDefId(e.target.value)}>
              <option value="">— Select a role —</option>
              {availableDefs.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
            {availableDefs.length === 0 && (
              <p className="text-xs mt-1 text-amber-600 dark:text-amber-400">All available roles are already assigned.</p>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 dark:border-slate-600" />
            <span className="text-sm text-gray-700 dark:text-slate-300">Set as primary role</span>
          </label>
          {selectedDefId && (() => {
            const def = definitions.find((d: any) => d.id === selectedDefId);
            return def?.dashboardPath ? (
              <div className="rounded-lg p-3 text-xs bg-blue-50 dark:bg-slate-800/60">
                <span className="text-gray-500 dark:text-slate-400">Dashboard: </span>
                <span className="font-mono text-blue-600 dark:text-[#6366f1]">{def.dashboardPath}</span>
              </div>
            ) : null;
          })()}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAssignOpen(false)} className="flex-1 py-2.5 text-sm rounded-lg border transition-colors text-gray-600 bg-white border-gray-200 hover:bg-gray-50 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700">Cancel</button>
            <button onClick={handleAssign} disabled={loading || !selectedDefId}
              className="flex-1 py-2.5 text-sm text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e3]">
              {loading && <RefreshCw size={13} className="animate-spin" />} Assign Role
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Tab: Teaching ────────────────────────────────────────────────────────────

function TeachingTab({ staff, schoolId }: { staff: any; schoolId: string }) {
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [streamSubjects, setStreamSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const res = await getStaffTeacherRecord(staff.id);
    setTeacher(res.data ?? null);
    setLoading(false);
  }

  async function loadStreamSubjects() {
    const res = await getSchoolStreamSubjectsForAssignment(schoolId);
    setStreamSubjects(res.data ?? []);
  }

  useEffect(() => { load(); }, [staff.id]);

  async function handleAssign() {
    if (!selectedSubjectId || !teacher) return;
    setSaving(true); setErr("");
    try {
      const res = await assignTeacherToStreamSubject({ streamSubjectId: selectedSubjectId, teacherId: teacher.id });
      if (!res.ok) { setErr(res.message ?? "Failed to assign"); return; }
      load(); setAssignOpen(false); setSelectedSubjectId("");
    } finally { setSaving(false); }
  }

  async function handleUnassign(assignmentId: string) {
    if (!confirm("Unassign this subject from the teacher?")) return;
    const res = await removeTeacherFromStreamSubject({ assignmentId });
    if (res.ok) load();
    else alert(res.message);
  }

  if (loading) return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-pulse bg-gray-100 dark:bg-slate-800/30" />)}
    </div>
  );

  if (!teacher) return (
    <div className="rounded-xl p-6 border text-center bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20">
      <Briefcase size={24} className="mx-auto mb-2 text-amber-400" />
      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">No Teacher record linked</p>
      <p className="text-xs mt-1 text-amber-500 dark:text-amber-500">This staff member doesn't have a linked Teacher record. This is created automatically when a TEACHING staff member is added.</p>
    </div>
  );

  const assignments = teacher.streamSubjectAssignments ?? [];
  const assignedSubjectIds = new Set(assignments.map((a: any) => a.streamSubjectId));
  const filteredSubjects = streamSubjects.filter((s: any) => {
    if (assignedSubjectIds.has(s.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.subject?.name?.toLowerCase().includes(q) ||
           s.stream?.name?.toLowerCase().includes(q) ||
           s.subject?.code?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-black dark:text-slate-200">
            {assignments.length} subject{assignments.length !== 1 ? "s" : ""} assigned
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500">Teacher ID: <span className="font-mono">{teacher.staffNo}</span></p>
        </div>
        <button onClick={() => { setErr(""); loadStreamSubjects(); setAssignOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:text-[#6366f1] dark:bg-[#6366f1]/10 dark:border-[#6366f1]/20 dark:hover:bg-[#6366f1]/20">
          <Plus size={12} /> Assign Subject
        </button>
      </div>

      {assignments.length === 0 ? (
        <EmptyState icon={BookOpen} message="No subjects assigned yet" />
      ) : (
        <div className="space-y-2">
          {assignments.map((a: any) => {
            const ss = a.streamSubject;
            return (
              <div key={a.id} className={`flex items-center justify-between p-4 rounded-xl border ${cardCls}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-100 dark:bg-indigo-500/15 flex-shrink-0">
                    <BookOpen size={15} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-black dark:text-slate-200">{ss.subject?.name}</span>
                      {ss.subjectPaper && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400">
                          Paper {ss.subjectPaper.paperNumber}
                          {ss.subjectPaper.name ? ` — ${ss.subjectPaper.name}` : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 text-gray-400 dark:text-slate-500">
                      {ss.stream?.name} · {ss.term?.name}
                    </p>
                    <p className="text-xs text-gray-300 dark:text-slate-600">
                      {ss._count?.studentEnrollments ?? 0} student{ss._count?.studentEnrollments !== 1 ? "s" : ""} enrolled
                    </p>
                  </div>
                </div>
                <button onClick={() => handleUnassign(a.id)}
                  className="text-xs px-2.5 py-1 rounded-lg border transition-colors text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/10 flex-shrink-0">
                  Unassign
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal title="Assign Stream Subject" open={assignOpen} onClose={() => setAssignOpen(false)} width="max-w-xl">
        <div className="p-6 space-y-4">
          {err && <ErrBanner msg={err} />}
          <div>
            <label className={labelCls}>Search subjects</label>
            <input className={inputCls} placeholder="Filter by subject, stream, code…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Select Stream Subject *</label>
            <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-lg border p-2 border-gray-200 dark:border-slate-700/60">
              {filteredSubjects.length === 0 ? (
                <p className="text-xs text-center py-4 text-gray-400 dark:text-slate-500">
                  {search ? "No matching subjects found" : "All subjects already assigned or none available"}
                </p>
              ) : filteredSubjects.map((s: any) => (
                <label key={s.id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${selectedSubjectId === s.id ? "bg-blue-50 dark:bg-[#6366f1]/10" : "hover:bg-gray-50 dark:hover:bg-slate-800/50"}`}>
                  <input type="radio" name="streamSubject" value={s.id} checked={selectedSubjectId === s.id}
                    onChange={() => setSelectedSubjectId(s.id)} className="text-blue-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-black dark:text-slate-200">{s.subject?.name}</span>
                      {s.subjectPaper && (
                        <span className="text-xs text-gray-400 dark:text-slate-500">Paper {s.subjectPaper.paperNumber}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{s.stream?.name} · {s.term?.name}</p>
                    <p className="text-xs text-gray-300 dark:text-slate-600">{s.teachers?.length ?? 0} teacher{s.teachers?.length !== 1 ? "s" : ""} assigned</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAssignOpen(false)} className="flex-1 py-2.5 text-sm rounded-lg border transition-colors text-gray-600 bg-white border-gray-200 hover:bg-gray-50 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700">Cancel</button>
            <button onClick={handleAssign} disabled={saving || !selectedSubjectId}
              className="flex-1 py-2.5 text-sm text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 bg-blue-600 hover:bg-blue-700 dark:bg-[#6366f1] dark:hover:bg-[#5558e3]">
              {saving && <RefreshCw size={13} className="animate-spin" />} Assign Subject
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


// schoolId is resolved server-side in page.tsx and passed as a plain prop.
// No next/headers imports here — this is a pure client component.

interface StaffDetailClientProps {
  slug:     string;
  staffId:  string;
  schoolName: string; // ← passed from the server page, never fetched client-side
  schoolId: string; // ← passed from the server page, never fetched client-side
}

export default function StaffDetailClient({ slug, staffId, schoolId, schoolName }: StaffDetailClientProps) {
  const router    = useRouter();
  const [staff,     setStaff]     = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading,   setLoading]   = useState(true);

  async function load() {
    setLoading(true);
    setStaff(await getStaffById(staffId));
    setLoading(false);
  }
  useEffect(() => { load(); }, [staffId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/60 dark:bg-[#080c10]">
      <RefreshCw size={24} className="animate-spin text-blue-500 dark:text-[#6366f1]" />
    </div>
  );

  if (!staff) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/60 dark:bg-[#080c10]">
      <div className="text-center">
        <p className="mb-3 text-blue-500 dark:text-slate-400">Staff member not found.</p>
        <button onClick={() => router.back()} className="text-sm text-blue-600 dark:text-[#6366f1]">← Go back</button>
      </div>
    </div>
  );

  const primaryRole = staff.roles?.find((r: any) => r.isPrimary) ?? staff.roles?.[0];
  const SLS: Record<string,string> = {
    ACTIVE:    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    ON_LEAVE:  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    SUSPENDED: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
    RESIGNED:  "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
    TERMINATED:"bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  };

  return (
    <div className="min-h-screen bg-blue-50/60 text-blue-900 dark:bg-[#080c10] dark:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-200/30 to-transparent dark:from-[#6366f1]/8 dark:to-transparent" />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm mb-6 transition-colors text-gray-400 hover:text-black dark:text-slate-500 dark:hover:text-slate-300">
          <ArrowLeft size={16} /> All Staff
        </button>

        {/* Profile header */}
        <div className="rounded-2xl p-6 mb-6 border bg-white border-blue-100 shadow-sm dark:bg-[#0d1117] dark:border-slate-800/80 dark:shadow-none">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {staff.imageUrl
              ? <img src={staff.imageUrl} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-blue-200 dark:ring-slate-700" alt="" />
              : <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-2xl ring-2 bg-gradient-to-br from-blue-100 to-violet-100 text-blue-600 ring-blue-200 dark:from-[#6366f1]/30 dark:to-[#8b5cf6]/30 dark:text-[#a5b4fc] dark:ring-slate-700">{staff.firstName[0]}{staff.lastName[0]}</div>
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-black dark:text-white">{staff.firstName} {staff.lastName}</h1>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-sm font-mono text-gray-400 dark:text-slate-500">{staff.staffId}</span>
                    {staff.user?.loginId && <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-600 dark:bg-slate-800 dark:text-slate-400">{staff.user.loginId}</span>}
                    {primaryRole && <span className="text-sm flex items-center gap-1 text-gray-500 dark:text-slate-400"><Shield size={12}/>{primaryRole.roleDefinition.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${SLS[staff.status] ?? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}>{staff.status.replace(/_/g," ")}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${staff.staffType==="TEACHING" ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20" : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20"}`}>{staff.staffType==="TEACHING"?"Teaching":"Non-Teaching"}</span>
                </div>
              </div>
              <div className="flex items-center gap-5 mt-3 text-sm flex-wrap text-gray-500 dark:text-slate-500">
                {staff.phone && <span className="flex items-center gap-1.5"><Phone size={13}/>{staff.phone}</span>}
                {staff.email && <span className="flex items-center gap-1.5"><Mail size={13}/>{staff.email}</span>}
                {staff.basicSalary > 0 && <span className="flex items-center gap-1.5"><DollarSign size={13}/>UGX {staff.basicSalary.toLocaleString()}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6">
          {TABS.filter(tab => !(tab as any).teachingOnly || staff.staffType === "TEACHING").map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab===tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-300/30 dark:bg-[#6366f1] dark:shadow-[#6366f1]/20" : "text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800/50"}`}>
              <tab.icon size={14}/>{tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="rounded-2xl p-6 border bg-white border-blue-100 shadow-sm dark:bg-[#0d1117] dark:border-slate-800/80 dark:shadow-none">
          {activeTab==="overview"     && <OverviewTab staff={staff} onEditSuccess={load} />}
          {activeTab==="roles"        && <RolesTab staff={staff} schoolId={schoolId} onRefresh={load} />}
          {activeTab==="teaching"     && staff.staffType === "TEACHING" && <TeachingTab staff={staff} schoolId={schoolId} />}
          {activeTab==="leave"        && <LeaveTab staff={staff} schoolId={schoolId} />}
          {activeTab==="payroll"      && <PayrollTab staff={staff} />}
          {activeTab==="documents"    && <DocumentsTab staff={staff} schoolId={schoolId} />}
          {activeTab==="disciplinary" && <DisciplinaryTab staff={staff} schoolId={schoolId} />}
          {activeTab==="loans"        && <LoansTab staff={staff} schoolId={schoolId} />}
          {activeTab==="history"      && <HistoryTab staff={staff} />}
          {activeTab==="contracts"    && <ContractsTab staff={staff} schoolId={schoolId} />}
          {activeTab==="appraisals"   && <AppraisalsTab staff={staff} schoolId={schoolId} />}
        </div>
      </div>
    </div>
  );
}