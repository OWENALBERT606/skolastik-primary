import { Role, User, UserType } from "@prisma/client";

export type CategoryProps = {
  title: string;
  slug: string;
  imageUrl: string;
  description: string;
};
export type SavingProps = {
  amount: number;
  month: string;
  name: string;
  userId: string;
  paymentDate: any;
};
export type UserProps = {
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  image: string;
  email: string;
  password: string;
  loginId: string;
  schoolId: string;
  loginType: string;
  userType: UserType;
};
export type LoginProps = {
  identifier: string; // email address OR teacher Staff ID
  password:   string;
};
export type ForgotPasswordProps = {
  email: string;
};

// types/types.ts

export interface RoleFormData {
  displayName: string;
  description?: string;
  permissions: string[];
}

export interface UserWithRoles extends User {
  roles: Role[];
}

export interface RoleOption {
  label: string;
  value: string;
}

export interface UpdateUserRoleResponse {
  error: string | null;
  status: number;
  data: UserWithRoles | null;
}

export interface RoleResponse {
  id: string;
  displayName: string;
  description?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SchoolProps {
  id?: string;
  name: string;
  motto?: string;
  slug: string;
  address?: string;
  contact?: string;
  contact2?: string;
  contact3?: string;
  email?: string;
  email2?: string;
  website?: string;    // ✅ added
  logo?: string;
  isActive?: boolean;  // ✅ renamed to match Prisma
  adminId: string;
  createdAt?: Date;
  updatedAt?: Date;
}



// ─── Shared Types ────────────────────────────────────────────────────────────

export type StaffStatus = "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "RESIGNED" | "TERMINATED" | "RETIRED" | "CONTRACT_ENDED";
export type StaffType = "TEACHING" | "NON_TEACHING";
export type EmploymentType = "PERMANENT" | "CONTRACT" | "PART_TIME" | "VOLUNTEER" | "INTERN";
export type PayrollStatus = "DRAFT" | "PENDING" | "APPROVED" | "PAID" | "CANCELLED" | "ON_HOLD";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
export type LeaveType = "ANNUAL" | "SICK" | "MATERNITY" | "PATERNITY" | "COMPASSIONATE" | "STUDY" | "UNPAID" | "OTHER";
export type DisciplinaryStatus = "OPEN" | "UNDER_INVESTIGATION" | "HEARING_SCHEDULED" | "RESOLVED" | "APPEALED" | "CLOSED";
export type DisciplinaryType = "VERBAL_WARNING" | "WRITTEN_WARNING" | "FINAL_WARNING" | "SUSPENSION" | "DEMOTION" | "TERMINATION" | "OTHER";
export type AppraisalStatus = "DRAFT" | "SELF_REVIEW" | "MANAGER_REVIEW" | "MODERATION" | "COMPLETED" | "APPEALED";
export type TrainingStatus = "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "DEFERRED";
export type LoanStatus = "PENDING" | "APPROVED" | "ACTIVE" | "FULLY_REPAID" | "DEFAULTED" | "CANCELLED";
export type ExitStatus = "INITIATED" | "CLEARANCE_IN_PROGRESS" | "PENDING_APPROVAL" | "APPROVED" | "COMPLETED";

export interface Staff {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  gender: string;
  staffType: StaffType;
  employmentType: EmploymentType;
  status: StaffStatus;
  basicSalary: number;
  salaryGrade?: string;
  dateOfHire: string;
  imageUrl?: string;
  highestQualification?: string;
  specialization?: string;
  roles: Array<{ roleDefinition: { name: string; code: string; dashboardPath?: string } }>;
}

export interface PayrollBatch {
  id: string;
  batchNumber: string;
  payMonth: number;
  payYear: number;
  payPeriod: string;
  status: PayrollStatus;
  totalStaffCount: number;
  totalGrossSalary: number;
  totalNetSalary: number;
  totalNSSF: number;
  totalPAYE: number;
  preparedBy?: { name: string };
  approvedBy?: { name: string };
  paidAt?: string;
}

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  ON_LEAVE: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  SUSPENDED: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  RESIGNED: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  TERMINATED: "bg-red-500/15 text-red-400 border-red-500/30",
  RETIRED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  CONTRACT_ENDED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PAID: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  DRAFT: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  OPEN: "bg-red-500/15 text-red-400 border-red-500/30",
  CLOSED: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  REVIEW: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  TEACHING: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  NON_TEACHING: "bg-teal-500/15 text-teal-400 border-teal-500/30",
};