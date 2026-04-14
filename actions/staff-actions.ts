// "use server";

// import { revalidatePath } from "next/cache";
// import { db } from "@/prisma/db";
// import bcrypt from "bcryptjs";
// import { UserType } from "@prisma/client";
// import type {
//   StaffStatus,
//   StaffType,
//   EmploymentType,
//   StaffRoleType,
//   ContractType,
//   AttendanceStatus,
//   OvertimeStatus,
//   PayrollItemType,
//   LoanStatus,
//   SalaryAdvanceStatus,
//   AppraisalStatus,
//   AppraisalRating,
//   DisciplinaryType,
//   DisciplinaryStatus,
//   GrievanceStatus,
//   DocumentCategory,
//   TrainingStatus,
//   TrainingType,
//   NoticeAudience,
//   NoticeStatus,
//   LeaveType,
//   LeaveStatus,
//   ExitType,
//   ExitStatus,
//   ExpensePaymentMethod,
//   AllowanceType,
//   DeductionType,
// } from "@prisma/client";
// import { getAuthenticatedUser } from "@/config/useAuth";

// // ─── RESPONSE TYPE ────────────────────────────────────────────────────────────

// type ActionResponse<T = any> = {
//   ok: boolean;
//   message: string;
//   data?: T;
// };

// // ─── ID GENERATORS ───────────────────────────────────────────────────────────

// // async function generateStaffId(schoolId: string): Promise<string> {
// //   const now = new Date();
// //   const year = now.getFullYear();
// //   const month = now.getMonth() + 1;
// //   const monthStr = String(month).padStart(2, "0");

// //   const monthStart = new Date(year, month - 1, 1);
// //   const monthEnd   = new Date(year, month, 1);

// //   const countThisMonth = await db.staff.count({
// //     where: {
// //       schoolId,
// //       createdAt: { gte: monthStart, lt: monthEnd },
// //     },
// //   });

// //   const seq = String(countThisMonth + 1).padStart(3, "0");
// //   return `STF${year}${monthStr}${seq}`;
// // }

// // Replace generateStaffId in staff-actions.ts with this version
// // The old version used COUNT which causes conflicts when records exist from previous months
// // or when IDs have been deleted. This version finds the highest existing sequence for the
// // current month and increments from there, with a retry loop as extra safety.

// async function generateStaffId(schoolId: string): Promise<string> {
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = now.getMonth() + 1;
//   const monthStr = String(month).padStart(2, "0");
//   const prefix = `STF${year}${monthStr}`;

//   // Find the highest existing staffId with this prefix (this school)
//   const latest = await db.staff.findFirst({
//     where: {
//       schoolId,
//       staffId: { startsWith: prefix },
//     },
//     orderBy: { staffId: "desc" },
//     select: { staffId: true },
//   });

//   let seq = 1;
//   if (latest?.staffId) {
//     // Extract the numeric suffix e.g. "STF202603005" → 5
//     const suffix = latest.staffId.slice(prefix.length);
//     const parsed = parseInt(suffix, 10);
//     if (!isNaN(parsed)) seq = parsed + 1;
//   }

//   // Safety loop: keep incrementing if the generated ID somehow already exists
//   // (guards against race conditions on concurrent staff creation)
//   let candidate = `${prefix}${String(seq).padStart(3, "0")}`;
//   while (true) {
//     const conflict = await db.user.findUnique({
//       where: { schoolId_loginId: { schoolId, loginId: candidate } },
//     });
//     if (!conflict) break;
//     seq += 1;
//     candidate = `${prefix}${String(seq).padStart(3, "0")}`;
//   }

//   return candidate;
// }

// async function generateContractNumber(schoolId: string): Promise<string> {
//   const year = new Date().getFullYear();
//   const count = await db.staffContract.count({ where: { schoolId } });
//   return `CON${year}${String(count + 1).padStart(4, "0")}`;
// }

// async function generateAdvanceNumber(schoolId: string): Promise<string> {
//   const year = new Date().getFullYear();
//   const count = await db.salaryAdvance.count({ where: { schoolId } });
//   return `ADV${year}${String(count + 1).padStart(4, "0")}`;
// }

// async function generateLoanNumber(schoolId: string): Promise<string> {
//   const year = new Date().getFullYear();
//   const count = await db.staffLoan.count({ where: { schoolId } });
//   return `LOAN${year}${String(count + 1).padStart(4, "0")}`;
// }

// async function generateBatchNumber(
//   payMonth: number,
//   payYear: number
// ): Promise<string> {
//   const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
//   return `BATCH-${months[payMonth - 1]}-${payYear}`;
// }

// async function generateDisciplinaryCase(schoolId: string): Promise<string> {
//   const year = new Date().getFullYear();
//   const count = await db.disciplinaryRecord.count({ where: { schoolId } });
//   return `DISC${year}${String(count + 1).padStart(4, "0")}`;
// }

// async function generateGrievanceCase(schoolId: string): Promise<string> {
//   const year = new Date().getFullYear();
//   const count = await db.grievanceRecord.count({ where: { schoolId } });
//   return `GRIEV${year}${String(count + 1).padStart(4, "0")}`;
// }

// // ════════════════════════════════════════════════════════════════════════════
// // STAFF ROLE DEFINITIONS
// // ════════════════════════════════════════════════════════════════════════════

// export async function getStaffRoleDefinitions(schoolId: string) {
//   return db.staffRoleDefinition.findMany({
//     where: { schoolId, isActive: true },
//     orderBy: { name: "asc" },
//   });
// }

// export async function createStaffRoleDefinition(data: {
//   schoolId: string;
//   roleType: StaffRoleType;
//   name: string;
//   code: string;
//   description?: string;
//   permissions?: string[];
//   dashboardPath?: string;
// }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };

//   const role = await db.staffRoleDefinition.create({
//     data: { ...data, code: data.code.toUpperCase(), permissions: data.permissions ?? [] },
//   });

//   revalidatePath(`/staff/roles`);
//   return { ok: true, data: role, message: "Role created" };
// }

// export async function updateStaffRoleDefinition(
//   id: string,
//   data: {
//     name?: string;
//     description?: string;
//     permissions?: string[];
//     dashboardPath?: string;
//     isActive?: boolean;
//   }
// ): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };

//   const role = await db.staffRoleDefinition.update({ where: { id }, data });
//   revalidatePath(`/staff/roles`);
//   return { ok: true, data: role, message: "Role updated" };
// }

// // ════════════════════════════════════════════════════════════════════════════
// // STAFF CORE — READ
// // ════════════════════════════════════════════════════════════════════════════

// export async function getStaff(
//   schoolId: string,
//   filters?: { status?: StaffStatus; staffType?: StaffType; search?: string }
// ) {
//   return db.staff.findMany({
//     where: {
//       schoolId,
//       ...(filters?.status && { status: filters.status }),
//       ...(filters?.staffType && { staffType: filters.staffType }),
//       ...(filters?.search && {
//         OR: [
//           { firstName: { contains: filters.search, mode: "insensitive" } },
//           { lastName: { contains: filters.search, mode: "insensitive" } },
//           { staffId: { contains: filters.search, mode: "insensitive" } },
//           { phone: { contains: filters.search, mode: "insensitive" } },
//           { email: { contains: filters.search, mode: "insensitive" } },
//         ],
//       }),
//     },
//     include: {
//       user: {
//         select: {
//           id: true,
//           loginId: true,
//           userType: true,
//           status: true,
//           email: true,
//           phone: true,
//           image: true,
//         },
//       },
//       roles: { where: { isActive: true }, include: { roleDefinition: true } },
//     },
//     orderBy: { createdAt: "desc" },
//   });
// }

// export async function getStaffById(id: string) {
//   return db.staff.findUnique({
//     where: { id },
//     include: {
//       user: {
//         select: {
//           id: true,
//           name: true,
//           loginId: true,
//           userType: true,
//           status: true,
//           email: true,
//           phone: true,
//           image: true,
//         },
//       },
//       roles: { include: { roleDefinition: true } },
//       contracts: { orderBy: { createdAt: "desc" }, take: 1 },
//       leaveBalances: true,
//       allowanceProfiles: { where: { isActive: true } },
//       deductionProfiles: { where: { isActive: true } },
//     },
//   });
// }

// // ════════════════════════════════════════════════════════════════════════════
// // STAFF CORE — CREATE
// //
// // IMPORTANT: `schoolId` passed here must be the real DB id (cuid/uuid),
// // NOT the URL slug. The page component is responsible for resolving
// // slug → school.id before calling this action.
// // ════════════════════════════════════════════════════════════════════════════

// export type CreateStaffInput = {
//   schoolId: string; // ← must be real DB id, not URL slug
//   // Personal
//   firstName: string;
//   lastName: string;
//   phone: string;
//   email?: string;
//   gender: string;
//   dob?: Date;
//   nationality?: string;
//   nationalId?: string;
//   address?: string;
//   imageUrl?: string;
//   // Employment
//   staffType: StaffType;
//   employmentType: EmploymentType;
//   dateOfHire: Date;
//   basicSalary?: number;
//   salaryGrade?: string;
//   // Banking / payroll
//   bankName?: string;
//   bankAccount?: string;
//   mobileMoneyPhone?: string;
//   paymentMethod?: ExpensePaymentMethod;
//   // Qualifications
//   highestQualification?: string;
//   institutionAttended?: string;
//   specialization?: string;
//   // Statutory
//   nssfNumber?: string;
//   tinNumber?: string;
//   // Emergency
//   emergencyName?: string;
//   emergencyRelationship?: string;
//   emergencyPhone?: string;
//   // Optional
//   roleDefinitionId?: string;
//   password?: string;
// };

// // export async function createStaff(input: CreateStaffInput): Promise<ActionResponse> {
// //   // ✅ Uses getAuthenticatedUser — no sync cookies/headers access
// //   const user = await getAuthenticatedUser();
// //   if (!user?.id) return { ok: false, message: "Unauthorized" };

// //   const {
// //     schoolId,
// //     firstName,
// //     lastName,
// //     phone,
// //     email,
// //     password,
// //     roleDefinitionId,
// //     ...staffFields
// //   } = input;

// //   // ✅ Verify schoolId is a real school record (guards against slug being passed)
// //   const school = await db.school.findUnique({
// //     where: { id: schoolId },
// //     select: { id: true },
// //   });
// //   if (!school) {
// //     return { ok: false, message: "School not found. Ensure a valid school ID is provided." };
// //   }

// //   try {
// //     // ── 1. School-scoped uniqueness checks ───────────────────────────────
// //     const [phoneExists, emailExists] = await Promise.all([
// //       db.staff.findFirst({ where: { schoolId, phone } }),
// //       email ? db.staff.findFirst({ where: { schoolId, email } }) : null,
// //     ]);

// //     if (phoneExists) {
// //       return { ok: false, message: `Phone ${phone} is already used by another staff member in this school.` };
// //     }
// //     if (emailExists) {
// //       return { ok: false, message: `Email ${email} is already used by another staff member in this school.` };
// //     }

// //     // ── 2. Generate IDs ──────────────────────────────────────────────────
// //     const staffId = await generateStaffId(schoolId);
// //     const loginId = staffId;

// //     const loginIdTaken = await db.user.findUnique({
// //       where: { schoolId_loginId: { schoolId, loginId } },
// //     });
// //     if (loginIdTaken) {
// //       return { ok: false, message: "Generated login ID conflict — please retry." };
// //     }

// //     const plainPassword = password ?? phone;
// //     const hashedPassword = await bcrypt.hash(plainPassword, 10);
// //     const fullName = `${firstName} ${lastName}`.trim();

// //     const result = await db.$transaction(async (tx) => {
// //       // ── 3. Create User account ─────────────────────────────────────────
// //       const newUser = await tx.user.create({
// //         data: {
// //           name: fullName,
// //           firstName,
// //           lastName,
// //           phone,
// //           email: email ?? null,
// //           password: hashedPassword,
// //           userType: UserType.STAFF,
// //           loginId,
// //           schoolId,   // ← real DB id from school lookup above
// //           status: true,
// //           isVerfied: false,
// //         },
// //       });

// //       // ── 4. Create Staff record ─────────────────────────────────────────
// //       const staff = await tx.staff.create({
// //         data: {
// //           staffId,
// //           schoolId,
// //           userId: newUser.id,
// //           firstName,
// //           lastName,
// //           phone,
// //           email: email ?? null,
// //           basicSalary: staffFields.basicSalary ?? 0,
// //           dateOfHire: staffFields.dateOfHire,
// //           staffType: staffFields.staffType,
// //           employmentType: staffFields.employmentType,
// //           gender: staffFields.gender,
// //           dob: staffFields.dob,
// //           nationality: staffFields.nationality,
// //           nationalId: staffFields.nationalId,
// //           address: staffFields.address,
// //           imageUrl: staffFields.imageUrl,
// //           salaryGrade: staffFields.salaryGrade,
// //           bankName: staffFields.bankName,
// //           bankAccount: staffFields.bankAccount,
// //           mobileMoneyPhone: staffFields.mobileMoneyPhone,
// //           paymentMethod: staffFields.paymentMethod,
// //           highestQualification: staffFields.highestQualification,
// //           institutionAttended: staffFields.institutionAttended,
// //           specialization: staffFields.specialization,
// //           nssfNumber: staffFields.nssfNumber,
// //           tinNumber: staffFields.tinNumber,
// //           emergencyName: staffFields.emergencyName,
// //           emergencyRelationship: staffFields.emergencyRelationship,
// //           emergencyPhone: staffFields.emergencyPhone,
// //         },
// //       });

// //       // In staff-actions.ts → createStaff → inside the db.$transaction, 
// // // AFTER step 4 (creating the Staff record), add step 4b:

// // // ── 4b. Auto-create Teacher record for TEACHING staff ─────────────────
// // if (staffFields.staffType === "TEACHING") {
// //   // Check if a Teacher record already exists for this user (safety guard)
// //   const existingTeacher = await tx.teacher.findUnique({
// //     where: { userId: newUser.id },
// //   });

// //   if (!existingTeacher) {
// //     await tx.teacher.create({
// //       data: {
// //         userId:    newUser.id,
// //         schoolId,
// //         firstName: firstName,
// //         lastName:  lastName,
// //         phone:     phone,
// //         // email:     email ?? null,
// //         gender:    staffFields.gender,
// //         // Link back to staff record so you can cross-reference
// //         staffId:   staff.id,
// //         // Copy qualification fields if your Teacher model has them
// //         ...(staffFields.highestQualification && {
// //           highestQualification: staffFields.highestQualification,
// //         }),
// //         ...(staffFields.specialization && {
// //           specialization: staffFields.specialization,
// //         }),
// //         ...(staffFields.imageUrl && {
// //           imageUrl: staffFields.imageUrl,
// //         }),
// //       },
// //     });
// //   }
// // }

// //       // ── 5. Assign initial role if provided ────────────────────────────
// //       if (roleDefinitionId) {
// //         await tx.staffRole.create({
// //           data: {
// //             staffId: staff.id,
// //             staffRoleDefinitionId: roleDefinitionId,
// //             schoolId,
// //             isPrimary: true,
// //           },
// //         });
// //       }

// //       // ── 6. Employment history ──────────────────────────────────────────
// //       await tx.employmentHistory.create({
// //         data: {
// //           staffId: staff.id,
// //           schoolId,
// //           eventType: "HIRED",
// //           description: `${fullName} joined as ${staffFields.staffType}`,
// //           effectiveDate: staffFields.dateOfHire,
// //           newValue: {
// //             basicSalary: staffFields.basicSalary,
// //             employmentType: staffFields.employmentType,
// //           },
// //           performedById: user.id,
// //         },
// //       });

// //       return { staff, user: newUser };
// //     });

// //     revalidatePath("/staff");
// //     revalidatePath(`/dashboard/staff`);

// //     return {
// //       ok: true,
// //       message: `Staff ${fullName} created successfully.`,
// //       data: {
// //         staff: result.staff,
// //         loginCredentials: {
// //           loginId,
// //           password: plainPassword,
// //           userType: "STAFF",
// //           note: "The staff member should change their password after first login.",
// //         },
// //       },
// //     };
// //   } catch (error: any) {
// //     console.error("❌ createStaff:", error);
// //     if (error.code === "P2002") {
// //       return { ok: false, message: "Duplicate record — check phone, email or national ID." };
// //     }
// //     if (error.code === "P2003") {
// //       return { ok: false, message: "Invalid school reference. Please contact support." };
// //     }
// //     return { ok: false, message: error?.message ?? "Failed to create staff member." };
// //   }
// // }

// // // ════════════════════════════════════════════════════════════════════════════
// // // STAFF CORE — UPDATE
// // // ════════════════════════════════════════════════════════════════════════════

// // export async function updateStaff(
// //   id: string,
// //   data: {
// //     firstName?: string;
// //     lastName?: string;
// //     phone?: string;
// //     email?: string;
// //     gender?: string;
// //     dob?: Date;
// //     nationality?: string;
// //     nationalId?: string;
// //     address?: string;
// //     imageUrl?: string;
// //     basicSalary?: number;
// //     salaryGrade?: string;
// //     bankName?: string;
// //     bankAccount?: string;
// //     bankBranch?: string;
// //     mobileMoneyPhone?: string;
// //     paymentMethod?: ExpensePaymentMethod;
// //     highestQualification?: string;
// //     specialization?: string;
// //     nssfNumber?: string;
// //     tinNumber?: string;
// //     emergencyName?: string;
// //     emergencyPhone?: string;
// //     emergencyRelationship?: string;
// //   }
// // ): Promise<ActionResponse> {
// //   const user = await getAuthenticatedUser();
// //   if (!user?.id) return { ok: false, message: "Unauthorized" };

// //   try {
// //     const existing = await db.staff.findUniqueOrThrow({ where: { id } });

// //     const staff = await db.$transaction(async (tx) => {
// //       const updated = await tx.staff.update({ where: { id }, data });

// //       const userUpdate: Record<string, any> = {};
// //       if (data.firstName || data.lastName) {
// //         userUpdate.firstName = data.firstName ?? existing.firstName;
// //         userUpdate.lastName = data.lastName ?? existing.lastName;
// //         userUpdate.name = `${userUpdate.firstName} ${userUpdate.lastName}`;
// //       }
// //       if (data.phone) userUpdate.phone = data.phone;
// //       if (data.email !== undefined) userUpdate.email = data.email ?? null;

// //       if (Object.keys(userUpdate).length > 0) {
// //         await tx.user.update({ where: { id: existing.userId }, data: userUpdate });
// //       }

// //       if (data.basicSalary !== undefined && data.basicSalary !== existing.basicSalary) {
// //         await tx.employmentHistory.create({
// //           data: {
// //             staffId: id,
// //             schoolId: existing.schoolId,
// //             eventType: "SALARY_REVISED",
// //             description: "Salary revised",
// //             effectiveDate: new Date(),
// //             previousValue: { basicSalary: existing.basicSalary },
// //             newValue: { basicSalary: data.basicSalary },
// //             performedById: user.id,
// //           },
// //         });
// //       }

// //       return updated;
// //     });

// //     revalidatePath(`/staff/${id}`);
// //     return { ok: true, data: staff, message: "Staff updated successfully" };
// //   } catch (error: any) {
// //     console.error("❌ updateStaff:", error);
// //     return { ok: false, message: error?.message ?? "Failed to update staff" };
// //   }
// // }

// // export async function updateStaffStatus(
// //   id: string,
// //   status: StaffStatus,
// //   reason?: string
// // ): Promise<ActionResponse> {
// //   const user = await getAuthenticatedUser();
// //   if (!user?.id) return { ok: false, message: "Unauthorized" };

// //   try {
// //     const existing = await db.staff.findUniqueOrThrow({ where: { id } });

// //     const staff = await db.$transaction(async (tx) => {
// //       const updated = await tx.staff.update({ where: { id }, data: { status } });

// //       const userActive = ["ACTIVE", "ON_LEAVE"].includes(status);
// //       await tx.user.update({ where: { id: existing.userId }, data: { status: userActive } });

// //       await tx.employmentHistory.create({
// //         data: {
// //           staffId: id,
// //           schoolId: existing.schoolId,
// //           eventType: "STATUS_CHANGED",
// //           description: reason ?? `Status changed to ${status}`,
// //           effectiveDate: new Date(),
// //           previousValue: { status: existing.status },
// //           newValue: { status },
// //           performedById: user.id,
// //         },
// //       });

// //       return updated;
// //     });

// //     revalidatePath(`/staff/${id}`);
// //     return { ok: true, data: staff, message: `Status changed to ${status}` };
// //   } catch (error: any) {
// //     console.error("❌ updateStaffStatus:", error);
// //     return { ok: false, message: error?.message ?? "Failed to update status" };
// //   }
// // }



// // ─── PASTE THESE REPLACEMENT FUNCTIONS INTO staff-actions.ts ─────────────────
// // Replaces: createStaff, updateStaff, updateStaffStatus
// //
// // What changed:
// //  createStaff        → step 4b: auto-create Teacher record if staffType === "TEACHING"
// //  updateStaff        → syncs name/photo/qualifications to Teacher if linked
// //  updateStaffStatus  → syncs status to Teacher.currentStatus + Teacher.status

// import { TeacherStatus } from "@prisma/client";

// // ─── HELPER: map StaffStatus → TeacherStatus ─────────────────────────────────
// function toTeacherStatus(staffStatus: StaffStatus): TeacherStatus {
//   const map: Record<string, TeacherStatus> = {
//     ACTIVE:         TeacherStatus.ACTIVE,
//     ON_LEAVE:       TeacherStatus.ON_LEAVE,
//     SUSPENDED:      TeacherStatus.SUSPENDED,
//     RESIGNED:       TeacherStatus.RESIGNED,
//     TERMINATED:     TeacherStatus.TERMINATED,
//     RETIRED:        TeacherStatus.RETIRED,
//     CONTRACT_ENDED: TeacherStatus.TERMINATED, // closest equivalent
//   };
//   return map[staffStatus] ?? TeacherStatus.ACTIVE;
// }

// // ─── HELPER: generate Teacher staffNo from Staff.staffId ─────────────────────
// // Teacher.staffNo is @unique and required. We reuse the same ID with a TCH prefix.
// function toTeacherStaffNo(staffId: string): string {
//   // e.g. STF202603001 → TCH202603001
//   return staffId.replace(/^STF/, "TCH");
// }

// // ════════════════════════════════════════════════════════════════════════════
// // STAFF CORE — CREATE  (with Teacher auto-creation)
// // ════════════════════════════════════════════════════════════════════════════

// export async function createStaff(input: CreateStaffInput): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };

//   const {
//     schoolId,
//     firstName,
//     lastName,
//     phone,
//     email,
//     password,
//     roleDefinitionId,
//     ...staffFields
//   } = input;

//   // Verify schoolId is a real school record (guards against slug being passed)
//   const school = await db.school.findUnique({
//     where: { id: schoolId },
//     select: { id: true },
//   });
//   if (!school) {
//     return { ok: false, message: "School not found. Ensure a valid school ID is provided." };
//   }

//   try {
//     // ── 1. School-scoped uniqueness checks ───────────────────────────────
//     const [phoneExists, emailExists] = await Promise.all([
//       db.staff.findFirst({ where: { schoolId, phone } }),
//       email ? db.staff.findFirst({ where: { schoolId, email } }) : null,
//     ]);

//     if (phoneExists) {
//       return { ok: false, message: `Phone ${phone} is already used by another staff member in this school.` };
//     }
//     if (emailExists) {
//       return { ok: false, message: `Email ${email} is already used by another staff member in this school.` };
//     }

//     // ── 2. Generate IDs ──────────────────────────────────────────────────
//     const staffId = await generateStaffId(schoolId);
//     const loginId = staffId;

//     const loginIdTaken = await db.user.findUnique({
//       where: { schoolId_loginId: { schoolId, loginId } },
//     });
//     if (loginIdTaken) {
//       return { ok: false, message: "Generated login ID conflict — please retry." };
//     }

//     const plainPassword = password ?? phone;
//     const hashedPassword = await bcrypt.hash(plainPassword, 10);
//     const fullName = `${firstName} ${lastName}`.trim();

//     const result = await db.$transaction(async (tx) => {
//       // ── 3. Create User account ─────────────────────────────────────────
//       const newUser = await tx.user.create({
//         data: {
//           name: fullName,
//           firstName,
//           lastName,
//           phone,
//           email: email ?? null,
//           password: hashedPassword,
//           userType: UserType.STAFF,
//           loginId,
//           schoolId,
//           status: true,
//           isVerfied: false,
//         },
//       });

//       // ── 4. Create Staff record ─────────────────────────────────────────
//       const staff = await tx.staff.create({
//         data: {
//           staffId,
//           schoolId,
//           userId: newUser.id,
//           firstName,
//           lastName,
//           phone,
//           email: email ?? null,
//           basicSalary: staffFields.basicSalary ?? 0,
//           dateOfHire: staffFields.dateOfHire,
//           staffType: staffFields.staffType,
//           employmentType: staffFields.employmentType,
//           gender: staffFields.gender,
//           dob: staffFields.dob,
//           nationality: staffFields.nationality,
//           nationalId: staffFields.nationalId,
//           address: staffFields.address,
//           imageUrl: staffFields.imageUrl,
//           salaryGrade: staffFields.salaryGrade,
//           bankName: staffFields.bankName,
//           bankAccount: staffFields.bankAccount,
//           mobileMoneyPhone: staffFields.mobileMoneyPhone,
//           paymentMethod: staffFields.paymentMethod,
//           highestQualification: staffFields.highestQualification,
//           institutionAttended: staffFields.institutionAttended,
//           specialization: staffFields.specialization,
//           nssfNumber: staffFields.nssfNumber,
//           tinNumber: staffFields.tinNumber,
//           emergencyName: staffFields.emergencyName,
//           emergencyRelationship: staffFields.emergencyRelationship,
//           emergencyPhone: staffFields.emergencyPhone,
//         },
//       });

//       // ── 4b. Auto-create Teacher record for TEACHING staff ──────────────
//       //
//       // Teacher.staffNo  → required @unique  → reuse staffId with TCH prefix
//       // Teacher.dateOfBirth → required       → use dob if provided, else dateOfHire
//       //                                        (admin can correct it later)
//       // Teacher.employmentType → plain String (not enum)
//       // Teacher.role           → plain String (not enum)
//       // Teacher.profilePhoto   → mapped from imageUrl
//       // Teacher.staffId        → FK back to Staff.id (not staffId string)
//       if (staffFields.staffType === "TEACHING") {
//         const teacherStaffNo = toTeacherStaffNo(staffId);

//         // Guard: phone/email uniqueness in Teacher table
//         const [tPhone, tEmail] = await Promise.all([
//           phone ? tx.teacher.findUnique({ where: { phone } }) : null,
//           email ? tx.teacher.findUnique({ where: { email } }) : null,
//         ]);

//         if (!tPhone && !tEmail) {
//           await tx.teacher.create({
//             data: {
//               userId:       newUser.id,
//               schoolId,
//               staffNo:      teacherStaffNo,
//               staffId:      staff.id,           // ← FK to Staff.id
//               firstName,
//               lastName,
//               gender:       staffFields.gender ?? "Unknown",
//               // dateOfBirth is required on Teacher — use dob if supplied, else dateOfHire
//               dateOfBirth:  staffFields.dob ?? staffFields.dateOfHire,
//               phone,
//               email:        email ?? `${staffId.toLowerCase()}@staff.local`, // Teacher.email is @unique required
//               nationality:  staffFields.nationality ?? null,
//               address:      staffFields.address ?? null,
//               emergencyContactName:  staffFields.emergencyName ?? null,
//               emergencyRelationship: staffFields.emergencyRelationship ?? null,
//               emergencyPhone:        staffFields.emergencyPhone ?? null,
//               highestQualification:  staffFields.highestQualification ?? null,
//               specialization:        staffFields.specialization ?? null,
//               profilePhoto:          staffFields.imageUrl ?? null,
//               dateOfHire:   staffFields.dateOfHire,
//               employmentType: staffFields.employmentType as string,
//               role:           "TEACHER",
//               currentStatus:  TeacherStatus.ACTIVE,
//               status:         TeacherStatus.ACTIVE,
//             },
//           });
//         }
//         // If phone/email conflict exists in Teacher table we skip silently
//         // (admin can link manually). The Staff record is still created successfully.
//       }

//       // ── 5. Assign initial role if provided ────────────────────────────
//       if (roleDefinitionId) {
//         await tx.staffRole.create({
//           data: {
//             staffId: staff.id,
//             staffRoleDefinitionId: roleDefinitionId,
//             schoolId,
//             isPrimary: true,
//           },
//         });
//       }

//       // ── 6. Employment history ──────────────────────────────────────────
//       await tx.employmentHistory.create({
//         data: {
//           staffId: staff.id,
//           schoolId,
//           eventType: "HIRED",
//           description: `${fullName} joined as ${staffFields.staffType}`,
//           effectiveDate: staffFields.dateOfHire,
//           newValue: {
//             basicSalary: staffFields.basicSalary,
//             employmentType: staffFields.employmentType,
//           },
//           performedById: user.id,
//         },
//       });

//       return { staff, user: newUser };
//     });

//     revalidatePath("/staff");
//     revalidatePath(`/dashboard/staff`);

//     return {
//       ok: true,
//       message: `Staff ${fullName} created successfully.`,
//       data: {
//         staff: result.staff,
//         loginCredentials: {
//           loginId,
//           password: plainPassword,
//           userType: "STAFF",
//           note: "The staff member should change their password after first login.",
//         },
//       },
//     };
//   } catch (error: any) {
//     console.error("❌ createStaff:", error);
//     if (error.code === "P2002") {
//       return { ok: false, message: "Duplicate record — check phone, email or national ID." };
//     }
//     if (error.code === "P2003") {
//       return { ok: false, message: "Invalid school reference. Please contact support." };
//     }
//     return { ok: false, message: error?.message ?? "Failed to create staff member." };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // STAFF CORE — UPDATE  (syncs to Teacher if linked)
// // ════════════════════════════════════════════════════════════════════════════

// export async function updateStaff(
//   id: string,
//   data: {
//     firstName?: string;
//     lastName?: string;
//     phone?: string;
//     email?: string;
//     gender?: string;
//     dob?: Date;
//     nationality?: string;
//     nationalId?: string;
//     address?: string;
//     imageUrl?: string;
//     basicSalary?: number;
//     salaryGrade?: string;
//     bankName?: string;
//     bankAccount?: string;
//     bankBranch?: string;
//     mobileMoneyPhone?: string;
//     paymentMethod?: ExpensePaymentMethod;
//     highestQualification?: string;
//     specialization?: string;
//     nssfNumber?: string;
//     tinNumber?: string;
//     emergencyName?: string;
//     emergencyPhone?: string;
//     emergencyRelationship?: string;
//   }
// ): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };

//   try {
//     const existing = await db.staff.findUniqueOrThrow({
//       where: { id },
//       include: {
//         // Load the linked Teacher record if it exists
//         teacher: { select: { id: true } },
//       },
//     });

//     const staff = await db.$transaction(async (tx) => {
//       // ── Update Staff ───────────────────────────────────────────────────
//       const updated = await tx.staff.update({ where: { id }, data });

//       // ── Sync User ──────────────────────────────────────────────────────
//       const userUpdate: Record<string, any> = {};
//       if (data.firstName || data.lastName) {
//         userUpdate.firstName = data.firstName ?? existing.firstName;
//         userUpdate.lastName  = data.lastName  ?? existing.lastName;
//         userUpdate.name = `${userUpdate.firstName} ${userUpdate.lastName}`;
//       }
//       if (data.phone) userUpdate.phone = data.phone;
//       if (data.email !== undefined) userUpdate.email = data.email ?? null;

//       if (Object.keys(userUpdate).length > 0) {
//         await tx.user.update({ where: { id: existing.userId }, data: userUpdate });
//       }

//       // ── Sync Teacher (only if this staff member has a linked Teacher) ──
//       if (existing.teacher) {
//         const teacherUpdate: Record<string, any> = {};

//         if (data.firstName !== undefined)           teacherUpdate.firstName           = data.firstName;
//         if (data.lastName  !== undefined)           teacherUpdate.lastName            = data.lastName;
//         if (data.gender    !== undefined)           teacherUpdate.gender              = data.gender;
//         if (data.dob       !== undefined)           teacherUpdate.dateOfBirth         = data.dob;
//         if (data.nationality !== undefined)         teacherUpdate.nationality         = data.nationality;
//         if (data.address   !== undefined)           teacherUpdate.address             = data.address;
//         if (data.phone     !== undefined)           teacherUpdate.phone               = data.phone;
//         if (data.email     !== undefined)           teacherUpdate.email               = data.email;
//         if (data.imageUrl  !== undefined)           teacherUpdate.profilePhoto        = data.imageUrl;
//         if (data.highestQualification !== undefined) teacherUpdate.highestQualification = data.highestQualification;
//         if (data.specialization !== undefined)      teacherUpdate.specialization      = data.specialization;
//         if (data.emergencyName !== undefined)        teacherUpdate.emergencyContactName = data.emergencyName;
//         if (data.emergencyPhone !== undefined)       teacherUpdate.emergencyPhone      = data.emergencyPhone;
//         if (data.emergencyRelationship !== undefined) teacherUpdate.emergencyRelationship = data.emergencyRelationship;

//         if (Object.keys(teacherUpdate).length > 0) {
//           await tx.teacher.update({
//             where: { id: existing.teacher.id },
//             data: teacherUpdate,
//           });
//         }
//       }

//       // ── Salary history ─────────────────────────────────────────────────
//       if (data.basicSalary !== undefined && data.basicSalary !== existing.basicSalary) {
//         await tx.employmentHistory.create({
//           data: {
//             staffId: id,
//             schoolId: existing.schoolId,
//             eventType: "SALARY_REVISED",
//             description: "Salary revised",
//             effectiveDate: new Date(),
//             previousValue: { basicSalary: existing.basicSalary },
//             newValue: { basicSalary: data.basicSalary },
//             performedById: user.id,
//           },
//         });
//       }

//       return updated;
//     });

//     revalidatePath(`/staff/${id}`);
//     return { ok: true, data: staff, message: "Staff updated successfully" };
//   } catch (error: any) {
//     console.error("❌ updateStaff:", error);
//     return { ok: false, message: error?.message ?? "Failed to update staff" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // STAFF STATUS UPDATE  (syncs to Teacher if linked)
// // ════════════════════════════════════════════════════════════════════════════

// export async function updateStaffStatus(
//   id: string,
//   status: StaffStatus,
//   reason?: string
// ): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };

//   try {
//     const existing = await db.staff.findUniqueOrThrow({
//       where: { id },
//       include: { teacher: { select: { id: true } } },
//     });

//     const staff = await db.$transaction(async (tx) => {
//       const updated = await tx.staff.update({ where: { id }, data: { status } });

//       // Sync User.status
//       const userActive = ["ACTIVE", "ON_LEAVE"].includes(status);
//       await tx.user.update({ where: { id: existing.userId }, data: { status: userActive } });

//       // Sync Teacher status if linked
//       if (existing.teacher) {
//         const teacherStatus = toTeacherStatus(status);
//         await tx.teacher.update({
//           where: { id: existing.teacher.id },
//           data: {
//             currentStatus: teacherStatus,
//             status:         teacherStatus,
//             // Record exit date if leaving
//             ...(["RESIGNED", "TERMINATED", "RETIRED"].includes(status) && {
//               exitDate:   new Date(),
//               exitReason: reason ?? `${status} via HR module`,
//             }),
//           },
//         });
//       }

//       // Employment history
//       await tx.employmentHistory.create({
//         data: {
//           staffId: id,
//           schoolId: existing.schoolId,
//           eventType: "STATUS_CHANGED",
//           description: reason ?? `Status changed to ${status}`,
//           effectiveDate: new Date(),
//           previousValue: { status: existing.status },
//           newValue: { status },
//           performedById: user.id,
//         },
//       });

//       return updated;
//     });

//     revalidatePath(`/staff/${id}`);
//     return { ok: true, data: staff, message: `Status changed to ${status}` };
//   } catch (error: any) {
//     console.error("❌ updateStaffStatus:", error);
//     return { ok: false, message: error?.message ?? "Failed to update status" };
//   }
// }


// export async function resetStaffPassword(
//   staffId: string,
//   newPassword?: string
// ): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };

//   try {
//     const staff = await db.staff.findUnique({
//       where: { id: staffId },
//       select: { userId: true, phone: true, firstName: true, lastName: true },
//     });
//     if (!staff) return { ok: false, message: "Staff not found" };

//     const plain = newPassword ?? staff.phone;
//     const hashed = await bcrypt.hash(plain, 10);

//     await db.user.update({
//       where: { id: staff.userId },
//       data: { password: hashed },
//     });

//     return {
//       ok: true,
//       data: { temporaryPassword: plain },
//       message: `Password reset for ${staff.firstName} ${staff.lastName}. New password: ${plain}`,
//     };
//   } catch (error: any) {
//     console.error("❌ resetStaffPassword:", error);
//     return { ok: false, message: error?.message ?? "Failed to reset password" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // ROLE ASSIGNMENT
// // ════════════════════════════════════════════════════════════════════════════

// export async function assignStaffRole(data: {
//   staffId: string;
//   staffRoleDefinitionId: string;
//   schoolId: string;
//   isPrimary?: boolean;
//   notes?: string;
// }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };

//   if (data.isPrimary) {
//     await db.staffRole.updateMany({
//       where: { staffId: data.staffId, schoolId: data.schoolId },
//       data: { isPrimary: false },
//     });
//   }

//   const role = await db.staffRole.upsert({
//     where: {
//       staffId_staffRoleDefinitionId: {
//         staffId: data.staffId,
//         staffRoleDefinitionId: data.staffRoleDefinitionId,
//       },
//     },
//     update: { isActive: true, isPrimary: data.isPrimary ?? false, notes: data.notes },
//     create: {
//       staffId: data.staffId,
//       staffRoleDefinitionId: data.staffRoleDefinitionId,
//       schoolId: data.schoolId,
//       isPrimary: data.isPrimary ?? false,
//       notes: data.notes,
//     },
//   });

//   revalidatePath(`/staff/${data.staffId}`);
//   return { ok: true, data: role, message: "Role assigned" };
// }

// export async function removeStaffRole(
//   staffId: string,
//   staffRoleDefinitionId: string
// ): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };

//   await db.staffRole.update({
//     where: { staffId_staffRoleDefinitionId: { staffId, staffRoleDefinitionId } },
//     data: { isActive: false, endDate: new Date() },
//   });

//   revalidatePath(`/staff/${staffId}`);
//   return { ok: true, message: "Role removed" };
// }

// // ════════════════════════════════════════════════════════════════════════════
// // CONTRACTS & EMPLOYMENT HISTORY
// // ════════════════════════════════════════════════════════════════════════════

// export async function getStaffContracts(staffId: string) {
//   return db.staffContract.findMany({
//     where: { staffId },
//     include: { issuedBy: { select: { name: true } } },
//     orderBy: { createdAt: "desc" },
//   });
// }

// export async function createStaffContract(data: {
//   staffId: string;
//   schoolId: string;
//   contractType: ContractType;
//   title: string;
//   startDate: Date;
//   endDate?: Date;
//   probationEndDate?: Date;
//   noticePeriodDays?: number;
//   basicSalary: number;
//   salaryGrade?: string;
//   employmentType: EmploymentType;
//   termsAndConditions?: string;
//   jobDescription?: string;
//   workingHoursPerWeek?: number;
//   documentUrl?: string;
//   renewedFromId?: string;
// }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };

//   const contractNumber = await generateContractNumber(data.schoolId);
//   const contract = await db.staffContract.create({
//     data: { ...data, contractNumber, status: "DRAFT", issuedById: user.id },
//   });

//   revalidatePath(`/staff/${data.staffId}/contracts`);
//   return { ok: true, data: contract, message: "Contract created" };
// }

// export async function activateContract(id: string): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };

//   const contract = await db.staffContract.update({ where: { id }, data: { status: "ACTIVE" } });
//   revalidatePath(`/staff/${contract.staffId}/contracts`);
//   return { ok: true, data: contract, message: "Contract activated" };
// }

// export async function signContractAsStaff(id: string): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };

//   const contract = await db.staffContract.update({
//     where: { id },
//     data: { signedByStaff: true, staffSignedAt: new Date() },
//   });
//   revalidatePath(`/staff/${contract.staffId}/contracts`);
//   return { ok: true, data: contract, message: "Contract signed" };
// }

// export async function getEmploymentHistory(staffId: string) {
//   return db.employmentHistory.findMany({
//     where: { staffId },
//     include: { performedBy: { select: { name: true } } },
//     orderBy: { effectiveDate: "desc" },
//   });
// }

// // ════════════════════════════════════════════════════════════════════════════
// // ATTENDANCE
// // ════════════════════════════════════════════════════════════════════════════

// export async function getAttendanceRecords(
//   schoolId: string,
//   filters?: { staffId?: string; from?: Date; to?: Date; status?: AttendanceStatus }
// ) {
//   return db.attendanceRecord.findMany({
//     where: {
//       schoolId,
//       ...(filters?.staffId && { staffId: filters.staffId }),
//       ...(filters?.status && { status: filters.status }),
//       ...((filters?.from || filters?.to) && {
//         date: {
//           ...(filters.from && { gte: filters.from }),
//           ...(filters.to && { lte: filters.to }),
//         },
//       }),
//     },
//     include: {
//       staff: { select: { firstName: true, lastName: true, staffId: true } },
//       enteredBy: { select: { name: true } },
//     },
//     orderBy: { date: "desc" },
//   });
// }

// export async function markAttendance(data: {
//   staffId: string;
//   schoolId: string;
//   date: Date;
//   status: AttendanceStatus;
//   checkInTime?: Date;
//   checkOutTime?: Date;
//   lateMinutes?: number;
//   lateReason?: string;
//   absenceReason?: string;
//   leaveRequestId?: string;
//   notes?: string;
// }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };

//   const hoursWorked =
//     data.checkInTime && data.checkOutTime
//       ? (data.checkOutTime.getTime() - data.checkInTime.getTime()) / 3600000
//       : undefined;

//   const record = await db.attendanceRecord.upsert({
//     where: { staffId_date: { staffId: data.staffId, date: data.date } },
//     update: { ...data, hoursWorked, isManualEntry: true, enteredById: user.id },
//     create: { ...data, hoursWorked, isManualEntry: true, enteredById: user.id },
//   });

//   revalidatePath(`/staff/attendance`);
//   return { ok: true, data: record, message: "Attendance recorded" };
// }

// export async function bulkMarkAttendance(
//   schoolId: string,
//   date: Date,
//   records: Array<{
//     staffId: string;
//     status: AttendanceStatus;
//     checkInTime?: Date;
//     checkOutTime?: Date;
//     lateMinutes?: number;
//     notes?: string;
//   }>
// ): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };

//   const results = await db.$transaction(
//     records.map((r) =>
//       db.attendanceRecord.upsert({
//         where: { staffId_date: { staffId: r.staffId, date } },
//         update: { ...r, isManualEntry: true, enteredById: user.id },
//         create: { ...r, schoolId, date, isManualEntry: true, enteredById: user.id },
//       })
//     )
//   );

//   revalidatePath(`/staff/attendance`);
//   return { ok: true, data: { count: results.length }, message: `${results.length} records saved` };
// }

// export async function computeAttendanceSummary(
//   staffId: string,
//   schoolId: string,
//   month: number,
//   year: number
// ): Promise<ActionResponse> {
//   const startDate = new Date(year, month - 1, 1);
//   const endDate = new Date(year, month, 0);

//   const [records, overtimeRecords] = await Promise.all([
//     db.attendanceRecord.findMany({ where: { staffId, date: { gte: startDate, lte: endDate } } }),
//     db.overtimeRequest.findMany({
//       where: { staffId, status: "APPROVED", date: { gte: startDate, lte: endDate } },
//     }),
//   ]);

//   const summary = {
//     staffId,
//     schoolId,
//     month,
//     year,
//     totalWorkingDays: records.filter((r) => !["PUBLIC_HOLIDAY", "WEEKEND"].includes(r.status)).length,
//     presentDays: records.filter((r) => r.status === "PRESENT").length,
//     absentDays: records.filter((r) => r.status === "ABSENT").length,
//     lateDays: records.filter((r) => r.status === "LATE").length,
//     halfDays: records.filter((r) => r.status === "HALF_DAY").length * 0.5,
//     leaveDays: records.filter((r) => r.status === "ON_LEAVE").length,
//     publicHolidays: records.filter((r) => r.status === "PUBLIC_HOLIDAY").length,
//     totalHoursWorked: records.reduce((s, r) => s + (r.hoursWorked ?? 0), 0),
//     totalOvertimeHours: overtimeRecords.reduce((s, r) => s + r.hoursWorked, 0),
//     attendancePercentage:
//       records.length > 0
//         ? (records.filter((r) => r.status === "PRESENT").length / records.length) * 100
//         : 0,
//     computedAt: new Date(),
//   };

//   await db.attendanceSummary.upsert({
//     where: { staffId_month_year: { staffId, month, year } },
//     update: summary,
//     create: summary,
//   });

//   return { ok: true, data: summary, message: "Attendance summary computed" };
// }

// // ════════════════════════════════════════════════════════════════════════════
// // OVERTIME
// // ════════════════════════════════════════════════════════════════════════════

// export async function getOvertimeRequests(
//   schoolId: string,
//   filters?: { staffId?: string; status?: OvertimeStatus }
// ) {
//   return db.overtimeRequest.findMany({
//     where: {
//       schoolId,
//       ...(filters?.staffId && { staffId: filters.staffId }),
//       ...(filters?.status && { status: filters.status }),
//     },
//     include: {
//       staff: { select: { firstName: true, lastName: true, staffId: true } },
//       approvedBy: { select: { name: true } },
//     },
//     orderBy: { createdAt: "desc" },
//   });
// }

// export async function createOvertimeRequest(data: {
//   staffId: string;
//   schoolId: string;
//   date: Date;
//   startTime: Date;
//   endTime: Date;
//   hoursWorked: number;
//   description: string;
//   compensationMethod?: string;
// }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };

//   const request = await db.overtimeRequest.create({
//     data: { ...data, status: "PENDING", compensationMethod: data.compensationMethod ?? "PAYMENT" },
//   });

//   revalidatePath(`/staff/overtime`);
//   return { ok: true, data: request, message: "Overtime request submitted" };
// }

// export async function approveOvertimeRequest(
//   id: string,
//   amountPayable?: number
// ): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };

//   const request = await db.overtimeRequest.update({
//     where: { id },
//     data: { status: "APPROVED", amountPayable, approvedById: user.id, approvedAt: new Date() },
//   });

//   revalidatePath(`/staff/overtime`);
//   return { ok: true, data: request, message: "Overtime approved" };
// }

// export async function rejectOvertimeRequest(id: string, reason: string): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };

//   const request = await db.overtimeRequest.update({
//     where: { id },
//     data: { status: "REJECTED", rejectionReason: reason, approvedById: user.id },
//   });

//   revalidatePath(`/staff/overtime`);
//   return { ok: true, data: request, message: "Overtime rejected" };
// }

// // ════════════════════════════════════════════════════════════════════════════
// // LEAVE MANAGEMENT
// // ════════════════════════════════════════════════════════════════════════════

// export async function getLeaveBalances(staffId: string, year: number) {
//   return db.leaveBalance.findMany({ where: { staffId, year } });
// }

// export async function initLeaveBalances(
//   staffId: string,
//   schoolId: string,
//   year: number
// ): Promise<ActionResponse> {
//   const defaults: Array<{ leaveType: LeaveType; entitled: number }> = [
//     { leaveType: "ANNUAL", entitled: 21 },
//     { leaveType: "SICK", entitled: 10 },
//     { leaveType: "MATERNITY", entitled: 60 },
//     { leaveType: "PATERNITY", entitled: 4 },
//     { leaveType: "COMPASSIONATE", entitled: 3 },
//     { leaveType: "STUDY", entitled: 5 },
//   ];

//   const records = await db.$transaction(
//     defaults.map((d) =>
//       db.leaveBalance.upsert({
//         where: { staffId_leaveType_year: { staffId, leaveType: d.leaveType, year } },
//         update: {},
//         create: { staffId, schoolId, year, ...d, remaining: d.entitled },
//       })
//     )
//   );

//   return { ok: true, data: records, message: "Leave balances initialized" };
// }

// export async function getLeaveRequests(
//   schoolId: string,
//   filters?: { staffId?: string; status?: LeaveStatus; leaveType?: LeaveType }
// ) {
//   return db.leaveRequest.findMany({
//     where: {
//       schoolId,
//       ...(filters?.staffId && { staffId: filters.staffId }),
//       ...(filters?.status && { status: filters.status }),
//       ...(filters?.leaveType && { leaveType: filters.leaveType }),
//     },
//     include: {
//       staff: { select: { firstName: true, lastName: true, staffId: true } },
//       approvedBy: { select: { name: true } },
//     },
//     orderBy: { createdAt: "desc" },
//   });
// }

// export async function createLeaveRequest(data: {
//   staffId: string;
//   schoolId: string;
//   leaveType: LeaveType;
//   startDate: Date;
//   endDate: Date;
//   daysRequested: number;
//   reason: string;
//   attachmentUrl?: string;
//   coverStaffId?: string;
// }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };

//   const year = data.startDate.getFullYear();
//   const balance = await db.leaveBalance.findUnique({
//     where: { staffId_leaveType_year: { staffId: data.staffId, leaveType: data.leaveType, year } },
//   });

//   if (balance && data.daysRequested > balance.remaining) {
//     return {
//       ok: false,
//       message: `Insufficient balance. Available: ${balance.remaining} days, Requested: ${data.daysRequested} days.`,
//     };
//   }

//   const request = await db.$transaction(async (tx) => {
//     const req = await tx.leaveRequest.create({ data: { ...data, status: "PENDING" } });
//     if (balance) {
//       await tx.leaveBalance.update({
//         where: { id: balance.id },
//         data: { pending: { increment: data.daysRequested } },
//       });
//     }
//     return req;
//   });

//   revalidatePath(`/staff/leave`);
//   return { ok: true, data: request, message: "Leave request submitted" };
// }

// export async function approveLeaveRequest(id: string): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };

//   const leave = await db.leaveRequest.findUniqueOrThrow({ where: { id } });
//   const year = leave.startDate.getFullYear();

//   const request = await db.$transaction(async (tx) => {
//     const updated = await tx.leaveRequest.update({
//       where: { id },
//       data: { status: "APPROVED", approvedById: user.id, approvedAt: new Date() },
//     });
//     await tx.leaveBalance.updateMany({
//       where: { staffId: leave.staffId, leaveType: leave.leaveType, year },
//       data: {
//         used: { increment: leave.daysRequested },
//         pending: { decrement: leave.daysRequested },
//         remaining: { decrement: leave.daysRequested },
//       },
//     });
//     return updated;
//   });

//   revalidatePath(`/staff/leave`);
//   return { ok: true, data: request, message: "Leave approved" };
// }

// export async function rejectLeaveRequest(id: string, reason: string): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };

//   const leave = await db.leaveRequest.findUniqueOrThrow({ where: { id } });
//   const year = leave.startDate.getFullYear();

//   const request = await db.$transaction(async (tx) => {
//     const updated = await tx.leaveRequest.update({
//       where: { id },
//       data: { status: "REJECTED", rejectionReason: reason, approvedById: user.id },
//     });
//     await tx.leaveBalance.updateMany({
//       where: { staffId: leave.staffId, leaveType: leave.leaveType, year },
//       data: { pending: { decrement: leave.daysRequested } },
//     });
//     return updated;
//   });

//   revalidatePath(`/staff/leave`);
//   return { ok: true, data: request, message: "Leave rejected" };
// }

// // ════════════════════════════════════════════════════════════════════════════
// // ALLOWANCE & DEDUCTION PROFILES
// // ════════════════════════════════════════════════════════════════════════════

// export async function addAllowanceProfile(data: {
//   staffId: string;
//   schoolId: string;
//   allowanceType: AllowanceType;
//   name: string;
//   amount: number;
//   isPercentage?: boolean;
//   effectiveFrom?: Date;
//   effectiveUntil?: Date;
// }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };

//   const profile = await db.staffAllowanceProfile.create({ data });
//   revalidatePath(`/staff/${data.staffId}`);
//   return { ok: true, data: profile, message: "Allowance added" };
// }

// export async function updateAllowanceProfile(
//   id: string,
//   data: { amount?: number; isActive?: boolean; effectiveUntil?: Date }
// ): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };

//   const profile = await db.staffAllowanceProfile.update({ where: { id }, data });
//   return { ok: true, data: profile, message: "Allowance updated" };
// }

// export async function addDeductionProfile(data: {
//   staffId: string;
//   schoolId: string;
//   deductionType: DeductionType;
//   name: string;
//   amount: number;
//   isPercentage?: boolean;
//   effectiveFrom?: Date;
//   effectiveUntil?: Date;
// }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };

//   const profile = await db.staffDeductionProfile.create({ data });
//   revalidatePath(`/staff/${data.staffId}`);
//   return { ok: true, data: profile, message: "Deduction added" };
// }

// export async function updateDeductionProfile(
//   id: string,
//   data: { amount?: number; isActive?: boolean; effectiveUntil?: Date }
// ): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };

//   const profile = await db.staffDeductionProfile.update({ where: { id }, data });
//   return { ok: true, data: profile, message: "Deduction updated" };
// }

// // ════════════════════════════════════════════════════════════════════════════
// // PAYROLL
// // ════════════════════════════════════════════════════════════════════════════

// function calculateUgandaPAYE(monthlyTaxable: number): number {
//   const annual = monthlyTaxable * 12;
//   let annualTax = 0;
//   if (annual <= 2820000) annualTax = 0;
//   else if (annual <= 4020000) annualTax = (annual - 2820000) * 0.1;
//   else if (annual <= 4920000) annualTax = 120000 + (annual - 4020000) * 0.2;
//   else if (annual <= 120000000) annualTax = 300000 + (annual - 4920000) * 0.3;
//   else annualTax = 35124000 + (annual - 120000000) * 0.4;
//   return annualTax / 12;
// }

// export async function createPayrollBatch(data: {
//   schoolId: string;
//   payMonth: number;
//   payYear: number;
// }): Promise<ActionResponse> {
//     console.log("createPayrollBatch received:", data); // ← add this
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };

//   const { schoolId, payMonth, payYear } = data;
//   const payPeriod = new Date(payYear, payMonth - 1, 1).toLocaleString("default", {
//     month: "long",
//     year: "numeric",
//   });

//   const existing = await db.payrollBatch.findUnique({
//     where: { schoolId_payMonth_payYear: { schoolId, payMonth, payYear } },
//   });
//   if (existing) return { ok: false, message: `Payroll batch for ${payPeriod} already exists.` };

//   const allStaff = await db.staff.findMany({
//     where: { schoolId, status: "ACTIVE" },
//     include: {
//       allowanceProfiles: { where: { isActive: true } },
//       deductionProfiles: { where: { isActive: true } },
//     },
//   });

//   const batchNumber = await generateBatchNumber(payMonth, payYear);

//   const result = await db.$transaction(async (tx) => {
//     const batch = await tx.payrollBatch.create({
//       data: {
//         schoolId, batchNumber, payMonth, payYear, payPeriod,
//         status: "DRAFT",
//         totalStaffCount: allStaff.length,
//         preparedById: user.id,
//         preparedAt: new Date(),
//       },
//     });

//     let totalGross = 0, totalNet = 0, totalAllowances = 0;
//     let totalDeductions = 0, totalNSSF = 0, totalPAYE = 0;

//     for (const staff of allStaff) {
//       const [attendance, overtimeRecords, activeLoans, activeAdvances] = await Promise.all([
//         tx.attendanceSummary.findUnique({
//           where: { staffId_month_year: { staffId: staff.id, month: payMonth, year: payYear } },
//         }),
//         tx.overtimeRequest.findMany({
//           where: {
//             staffId: staff.id, status: "APPROVED",
//             date: { gte: new Date(payYear, payMonth - 1, 1), lte: new Date(payYear, payMonth, 0) },
//           },
//         }),
//         tx.staffLoan.findMany({ where: { staffId: staff.id, status: "ACTIVE" } }),
//         tx.salaryAdvance.findMany({ where: { staffId: staff.id, status: "DISBURSED" } }),
//       ]);

//       const basicSalary = staff.basicSalary;
//       const allowanceItems = staff.allowanceProfiles.map((a) => ({
//         itemType: "ALLOWANCE" as PayrollItemType,
//         allowanceType: a.allowanceType,
//         name: a.name,
//         amount: a.isPercentage ? (basicSalary * a.amount) / 100 : a.amount,
//         isPercentage: a.isPercentage,
//         percentageOf: a.isPercentage ? basicSalary : null,
//       }));

//       const totalAllowanceAmount = allowanceItems.reduce((s, i) => s + i.amount, 0);
//       const grossSalary = basicSalary + totalAllowanceAmount;
//       const overtimePay = overtimeRecords.reduce((s, r) => s + (r.amountPayable ?? 0), 0);
//       const overtimeHours = overtimeRecords.reduce((s, r) => s + r.hoursWorked, 0);

//       const nssfEmployee = grossSalary * 0.05;
//       const nssfEmployer = grossSalary * 0.10;
//       const monthlyTaxable = grossSalary - nssfEmployee;
//       const payeAmount = calculateUgandaPAYE(monthlyTaxable);

//       const loanDeductions = activeLoans.reduce((s, l) => s + (l.monthlyInstalment ?? 0), 0);
//       const advanceDeductions = activeAdvances.reduce((s, a) => s + (a.monthlyRecovery ?? 0), 0);

//       const workingDays = attendance?.totalWorkingDays ?? 22;
//       const daysWorked = attendance?.presentDays ?? workingDays;
//       const absentDays = attendance?.absentDays ?? 0;
//       const absenceDeduction = absentDays * (basicSalary / workingDays);

//       const deductionItems = [
//         ...staff.deductionProfiles.map((d) => ({
//           itemType: "DEDUCTION" as PayrollItemType,
//           deductionType: d.deductionType,
//           name: d.name,
//           amount: d.isPercentage ? (basicSalary * d.amount) / 100 : d.amount,
//           isPercentage: d.isPercentage,
//           percentageOf: d.isPercentage ? basicSalary : null,
//         })),
//         { itemType: "DEDUCTION" as PayrollItemType, deductionType: "NSSF" as DeductionType, name: "NSSF (5%)", amount: nssfEmployee, isPercentage: true, percentageOf: grossSalary },
//         { itemType: "DEDUCTION" as PayrollItemType, deductionType: "PAYE" as DeductionType, name: "PAYE Tax", amount: payeAmount, isPercentage: false, percentageOf: null },
//         ...(loanDeductions > 0 ? [{ itemType: "DEDUCTION" as PayrollItemType, deductionType: "LOAN_REPAYMENT" as DeductionType, name: "Loan Repayment", amount: loanDeductions, isPercentage: false, percentageOf: null }] : []),
//         ...(advanceDeductions > 0 ? [{ itemType: "DEDUCTION" as PayrollItemType, deductionType: "CUSTOM" as DeductionType, name: "Advance Recovery", amount: advanceDeductions, isPercentage: false, percentageOf: null }] : []),
//         ...(absenceDeduction > 0 ? [{ itemType: "DEDUCTION" as PayrollItemType, deductionType: "ABSENCE" as DeductionType, name: `Absent ${absentDays} days`, amount: absenceDeduction, isPercentage: false, percentageOf: null }] : []),
//       ];

//       const totalDeductionAmount = deductionItems.reduce((s, i) => s + i.amount, 0);
//       const netSalary = grossSalary + overtimePay - totalDeductionAmount;

//       await tx.payroll.create({
//         data: {
//           schoolId, staffId: staff.id, batchId: batch.id, payMonth, payYear, payPeriod,
//           basicSalary, totalAllowances: totalAllowanceAmount, totalDeductions: totalDeductionAmount,
//           grossSalary: grossSalary + overtimePay, taxableIncome: monthlyTaxable,
//           nssfContribution: nssfEmployee, nssfEmployer, payeAmount,
//           loanDeductions, advanceDeductions, netSalary,
//           workingDays, daysWorked, absentDays, overtimeHours, overtimePay,
//           status: "DRAFT",
//           items: { create: [...allowanceItems, ...deductionItems] },
//         },
//       });

//       totalGross += grossSalary + overtimePay;
//       totalNet += netSalary;
//       totalAllowances += totalAllowanceAmount;
//       totalDeductions += totalDeductionAmount;
//       totalNSSF += nssfEmployee + nssfEmployer;
//       totalPAYE += payeAmount;
//     }

//     return tx.payrollBatch.update({
//       where: { id: batch.id },
//       data: { processedCount: allStaff.length, totalGrossSalary: totalGross, totalNetSalary: totalNet, totalAllowances, totalDeductions, totalNSSF, totalPAYE },
//     });
//   });

//   revalidatePath(`/staff/payroll`);
//   return { ok: true, data: result, message: `Payroll batch created for ${payPeriod}` };
// }

// export async function getPayrollBatches(schoolId: string) {
//   return db.payrollBatch.findMany({
//     where: { schoolId },
//     include: { preparedBy: { select: { name: true } }, approvedBy: { select: { name: true } }, _count: { select: { payrolls: true } } },
//     orderBy: [{ payYear: "desc" }, { payMonth: "desc" }],
//   });
// }

// export async function getPayrollBatchById(id: string) {
//   return db.payrollBatch.findUnique({
//     where: { id },
//     include: {
//       payrolls: { include: { staff: { select: { firstName: true, lastName: true, staffId: true } }, items: true } },
//       preparedBy: { select: { name: true } },
//       approvedBy: { select: { name: true } },
//     },
//   });
// }

// export async function submitBatchForApproval(id: string): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const batch = await db.payrollBatch.update({ where: { id, status: "DRAFT" }, data: { status: "REVIEW" } });
//   revalidatePath(`/staff/payroll`);
//   return { ok: true, data: batch, message: "Batch submitted for review" };
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Replace approveBatch and markBatchAsPaid in staff-actions.ts with these.
// // ─────────────────────────────────────────────────────────────────────────────

// export async function approveBatch(id: string): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };

//   const now = new Date();

//   // Step 1: flip the batch to APPROVED
//   const batch = await db.payrollBatch.update({
//     where: { id, status: "REVIEW" },
//     data:  { status: "APPROVED", approvedById: user.id, approvedAt: now },
//   });

//   // Step 2: stamp payrolls + mark overtime as PAID in parallel.
//   // OvertimeRequest schema only has: status (OvertimeStatus), approvedById,
//   // approvedAt, payrollItemId — no isPaid / paidAt / payrollBatchId fields.
//   await Promise.all([
//     db.payroll.updateMany({
//       where: { batchId: id },
//       data:  { status: "APPROVED", approvedById: user.id, approvedAt: now },
//     }),
//     db.overtimeRequest.updateMany({
//       where: {
//         schoolId: batch.schoolId,
//         status:   "APPROVED",
//         date: {
//           gte: new Date(batch.payYear, batch.payMonth - 1, 1),
//           lte: new Date(batch.payYear, batch.payMonth,     0),
//         },
//       },
//       data: { status: "PAID" },
//     }),
//   ]);

//   revalidatePath(`/staff/payroll`);
//   return { ok: true, data: batch, message: "Batch approved successfully" };
// }

// // ─────────────────────────────────────────────────────────────────────────────

// export async function markBatchAsPaid(
//   id: string,
//   data: { paymentRef: string; paymentMethod: ExpensePaymentMethod },
// ): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };

//   const now = new Date();

//   // Step 1: flip batch to PAID
//   const batch = await db.payrollBatch.update({
//     where: { id, status: "APPROVED" },
//     data: {
//       status:     "PAID",
//       paidAt:     now,
//       paymentRef: data.paymentRef,
//     },
//   });

//   // Step 2: stamp individual payroll rows.
//   // Overtime was already flipped to PAID during approveBatch — nothing more to do.
//   await db.payroll.updateMany({
//     where: { batchId: id },
//     data: {
//       status:        "PAID",
//       paidAt:        now,
//       paymentRef:    data.paymentRef,
//       paymentMethod: data.paymentMethod,
//     },
//   });

//   revalidatePath(`/staff/payroll`);
//   return { ok: true, data: batch, message: "Batch marked as paid" };
// }

// export async function getStaffPayrollHistory(staffId: string) {
//   return db.payroll.findMany({
//     where: { staffId },
//     include: { items: true, payslips: true },
//     orderBy: [{ payYear: "desc" }, { payMonth: "desc" }],
//   });
// }

// // ════════════════════════════════════════════════════════════════════════════
// // SALARY ADVANCE & LOANS
// // ════════════════════════════════════════════════════════════════════════════

// export async function getSalaryAdvances(schoolId: string, filters?: { staffId?: string; status?: SalaryAdvanceStatus }) {
//   return db.salaryAdvance.findMany({
//     where: { schoolId, ...(filters?.staffId && { staffId: filters.staffId }), ...(filters?.status && { status: filters.status }) },
//     include: { staff: { select: { firstName: true, lastName: true, staffId: true } }, approvedBy: { select: { name: true } }, repayments: true },
//     orderBy: { createdAt: "desc" },
//   });
// }

// export async function createSalaryAdvance(data: { staffId: string; schoolId: string; amountRequested: number; reason: string; recoveryStartMonth: number; recoveryStartYear: number; monthlyRecovery: number }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const advanceNumber = await generateAdvanceNumber(data.schoolId);
//   const advance = await db.salaryAdvance.create({ data: { ...data, advanceNumber, status: "PENDING" } });
//   revalidatePath(`/staff/advances`);
//   return { ok: true, data: advance, message: "Salary advance requested" };
// }

// export async function approveAdvance(id: string, amountApproved: number): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };
//   const advance = await db.salaryAdvance.update({ where: { id }, data: { status: "APPROVED", amountApproved, approvedById: user.id, approvedAt: new Date() } });
//   revalidatePath(`/staff/advances`);
//   return { ok: true, data: advance, message: "Advance approved" };
// }

// export async function disburseAdvance(id: string, disbursementRef: string): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const advance = await db.salaryAdvance.update({ where: { id, status: "APPROVED" }, data: { status: "DISBURSED", disbursedAt: new Date(), disbursementRef } });
//   revalidatePath(`/staff/advances`);
//   return { ok: true, data: advance, message: "Advance disbursed" };
// }

// export async function getStaffLoans(schoolId: string, filters?: { staffId?: string; status?: LoanStatus }) {
//   return db.staffLoan.findMany({
//     where: { schoolId, ...(filters?.staffId && { staffId: filters.staffId }), ...(filters?.status && { status: filters.status }) },
//     include: { staff: { select: { firstName: true, lastName: true, staffId: true } }, approvedBy: { select: { name: true } }, repayments: { orderBy: { paidAt: "desc" }, take: 5 } },
//     orderBy: { createdAt: "desc" },
//   });
// }

// export async function createStaffLoan(data: { staffId: string; schoolId: string; principalAmount: number; interestRate: number; tenureMonths: number; purpose: string; guarantorName?: string; guarantorPhone?: string }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const loanNumber = await generateLoanNumber(data.schoolId);
//   const totalRepayable = data.principalAmount * (1 + (data.interestRate / 100) * (data.tenureMonths / 12));
//   const monthlyInstalment = totalRepayable / data.tenureMonths;
//   const loan = await db.staffLoan.create({ data: { ...data, loanNumber, totalRepayable, monthlyInstalment, outstandingBalance: totalRepayable, status: "PENDING" } });
//   revalidatePath(`/staff/loans`);
//   return { ok: true, data: loan, message: "Loan request submitted" };
// }

// export async function approveLoan(id: string, approvedAmount: number): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };
//   const loan = await db.staffLoan.update({ where: { id }, data: { status: "APPROVED", approvedAmount, approvedById: user.id, approvedAt: new Date() } });
//   revalidatePath(`/staff/loans`);
//   return { ok: true, data: loan, message: "Loan approved" };
// }

// export async function disburseLoan(id: string, disbursementRef: string): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const loan = await db.staffLoan.findUniqueOrThrow({ where: { id } });
//   const updated = await db.staffLoan.update({
//     where: { id, status: "APPROVED" },
//     data: { status: "ACTIVE", disbursedAt: new Date(), disbursementRef, expectedEndDate: new Date(new Date().setMonth(new Date().getMonth() + loan.tenureMonths)) },
//   });
//   revalidatePath(`/staff/loans`);
//   return { ok: true, data: updated, message: "Loan disbursed" };
// }

// // ════════════════════════════════════════════════════════════════════════════
// // PERFORMANCE APPRAISAL
// // ════════════════════════════════════════════════════════════════════════════

// export async function getAppraisalCycles(schoolId: string) {
//   return db.appraisalCycle.findMany({ where: { schoolId }, include: { _count: { select: { appraisals: true } } }, orderBy: { year: "desc" } });
// }

// export async function createAppraisalCycle(data: { schoolId: string; name: string; year: number; term?: string; startDate: Date; endDate: Date; teachingWeight?: number; adminWeight?: number; punctualityWeight?: number; initiativeWeight?: number; teamworkWeight?: number }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const cycle = await db.appraisalCycle.create({ data });
//   revalidatePath(`/staff/appraisals`);
//   return { ok: true, data: cycle, message: "Appraisal cycle created" };
// }

// export async function getAppraisals(schoolId: string, cycleId?: string, filters?: { staffId?: string; status?: AppraisalStatus }) {
//   return db.performanceAppraisal.findMany({
//     where: { schoolId, ...(cycleId && { cycleId }), ...(filters?.staffId && { staffId: filters.staffId }), ...(filters?.status && { status: filters.status }) },
//     include: { staff: { select: { firstName: true, lastName: true, staffId: true } }, reviewer: { select: { firstName: true, lastName: true } }, cycle: { select: { name: true, year: true } } },
//     orderBy: { createdAt: "desc" },
//   });
// }

// export async function initiateSelfAppraisal(data: { staffId: string; schoolId: string; cycleId: string; reviewerId: string }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const appraisal = await db.performanceAppraisal.upsert({ where: { staffId_cycleId: { staffId: data.staffId, cycleId: data.cycleId } }, update: {}, create: { ...data, status: "SELF_REVIEW" } });
//   revalidatePath(`/staff/appraisals`);
//   return { ok: true, data: appraisal, message: "Self appraisal initiated" };
// }

// export async function submitSelfAppraisal(id: string, data: { selfScore: number; selfComments: string }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const appraisal = await db.performanceAppraisal.update({ where: { id }, data: { ...data, selfSubmittedAt: new Date(), status: "MANAGER_REVIEW" } });
//   revalidatePath(`/staff/appraisals`);
//   return { ok: true, data: appraisal, message: "Self appraisal submitted" };
// }

// export async function submitManagerReview(id: string, data: { teachingScore?: number; adminScore?: number; punctualityScore?: number; initiativeScore?: number; teamworkScore?: number; overallScore: number; finalRating: AppraisalRating; reviewerComments: string; strengthsNoted?: string; areasForImprovement?: string; developmentPlan?: string }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const appraisal = await db.performanceAppraisal.update({ where: { id }, data: { ...data, reviewerSubmittedAt: new Date(), status: "MODERATION" } });
//   revalidatePath(`/staff/appraisals`);
//   return { ok: true, data: appraisal, message: "Manager review submitted" };
// }

// export async function completeAppraisal(id: string, moderatedScore?: number, notes?: string): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const appraisal = await db.performanceAppraisal.update({ where: { id }, data: { status: "COMPLETED", moderatedScore, moderationNotes: notes, moderatedAt: new Date() } });
//   revalidatePath(`/staff/appraisals`);
//   return { ok: true, data: appraisal, message: "Appraisal completed" };
// }

// export async function acknowledgeAppraisal(id: string, responseNotes?: string): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const appraisal = await db.performanceAppraisal.update({ where: { id }, data: { staffAcknowledged: true, staffAcknowledgedAt: new Date(), staffResponseNotes: responseNotes } });
//   revalidatePath(`/staff/appraisals`);
//   return { ok: true, data: appraisal, message: "Appraisal acknowledged" };
// }

// // ════════════════════════════════════════════════════════════════════════════
// // DISCIPLINARY & GRIEVANCE
// // ════════════════════════════════════════════════════════════════════════════

// export async function getDisciplinaryRecords(schoolId: string, filters?: { staffId?: string; status?: DisciplinaryStatus }) {
//   return db.disciplinaryRecord.findMany({
//     where: { schoolId, ...(filters?.staffId && { staffId: filters.staffId }), ...(filters?.status && { status: filters.status }) },
//     include: { staff: { select: { firstName: true, lastName: true, staffId: true } }, issuedBy: { select: { firstName: true, lastName: true } } },
//     orderBy: { createdAt: "desc" },
//   });
// }

// export async function createDisciplinaryRecord(data: { staffId: string; schoolId: string; issuedById: string; disciplinaryType: DisciplinaryType; incidentDate: Date; incidentDescription: string; witnessNames?: string[] }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const caseNumber = await generateDisciplinaryCase(data.schoolId);
//   const record = await db.disciplinaryRecord.create({ data: { ...data, caseNumber, status: "OPEN", witnessNames: data.witnessNames ?? [] } });
//   revalidatePath(`/staff/disciplinary`);
//   return { ok: true, data: record, message: "Disciplinary record created" };
// }

// export async function updateDisciplinaryRecord(id: string, data: { status?: DisciplinaryStatus; investigationNotes?: string; hearingDate?: Date; hearingNotes?: string; outcome?: string; sanctionDetails?: string; sanctionStartDate?: Date; sanctionEndDate?: Date; suspensionWithPay?: boolean; isAppealed?: boolean; appealDate?: Date; appealOutcome?: string; documentUrls?: string[] }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };
//   const record = await db.disciplinaryRecord.update({ where: { id }, data: { ...data, ...(data.status === "CLOSED" && { closedAt: new Date(), closedById: user.id }) } });
//   revalidatePath(`/staff/disciplinary`);
//   return { ok: true, data: record, message: "Record updated" };
// }

// export async function getGrievanceRecords(schoolId: string, filters?: { status?: GrievanceStatus }) {
//   return db.grievanceRecord.findMany({
//     where: { schoolId, ...(filters?.status && { status: filters.status }) },
//     include: { staff: { select: { firstName: true, lastName: true, staffId: true } }, handledBy: { select: { firstName: true, lastName: true } } },
//     orderBy: { createdAt: "desc" },
//   });
// }

// export async function createGrievance(data: { staffId: string; schoolId: string; subject: string; description: string; isAnonymous?: boolean; documentUrls?: string[] }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const caseNumber = await generateGrievanceCase(data.schoolId);
//   const record = await db.grievanceRecord.create({ data: { ...data, caseNumber, status: "SUBMITTED", documentUrls: data.documentUrls ?? [] } });
//   revalidatePath(`/staff/grievances`);
//   return { ok: true, data: record, message: "Grievance submitted" };
// }

// export async function updateGrievance(id: string, data: { status?: GrievanceStatus; handledById?: string; investigationNotes?: string; mediationNotes?: string; resolutionDetails?: string; resolvedAt?: Date; escalatedAt?: Date; escalatedTo?: string; escalationNotes?: string; closedAt?: Date }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const record = await db.grievanceRecord.update({ where: { id }, data });
//   revalidatePath(`/staff/grievances`);
//   return { ok: true, data: record, message: "Grievance updated" };
// }

// // ════════════════════════════════════════════════════════════════════════════
// // STAFF DOCUMENTS
// // ════════════════════════════════════════════════════════════════════════════

// export async function getStaffDocuments(staffId: string, category?: DocumentCategory) {
//   return db.staffDocument.findMany({
//     where: { staffId, ...(category && { category }) },
//     include: { verifiedBy: { select: { name: true } }, uploadedBy: { select: { name: true } } },
//     orderBy: { createdAt: "desc" },
//   });
// }

// export async function uploadStaffDocument(data: { staffId: string; schoolId: string; category: DocumentCategory; name: string; description?: string; fileUrl: string; fileType?: string; fileSizeKb?: number; issueDate?: Date; expiryDate?: Date; isConfidential?: boolean }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };
//   const doc = await db.staffDocument.create({ data: { ...data, uploadedById: user.id } });
//   revalidatePath(`/staff/${data.staffId}/documents`);
//   return { ok: true, data: doc, message: "Document uploaded" };
// }

// export async function verifyStaffDocument(id: string): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };
//   const doc = await db.staffDocument.update({ where: { id }, data: { isVerified: true, verifiedById: user.id, verifiedAt: new Date() } });
//   return { ok: true, data: doc, message: "Document verified" };
// }

// export async function getExpiringDocuments(schoolId: string, withinDays = 30) {
//   const threshold = new Date();
//   threshold.setDate(threshold.getDate() + withinDays);
//   return db.staffDocument.findMany({
//     where: { schoolId, expiryDate: { lte: threshold, gte: new Date() } },
//     include: { staff: { select: { firstName: true, lastName: true, staffId: true } } },
//     orderBy: { expiryDate: "asc" },
//   });
// }

// // ════════════════════════════════════════════════════════════════════════════
// // TRAINING
// // ════════════════════════════════════════════════════════════════════════════

// export async function getTrainingPrograms(schoolId: string, status?: TrainingStatus) {
//   return db.trainingProgram.findMany({ where: { schoolId, ...(status && { status }) }, include: { _count: { select: { participants: true } }, createdBy: { select: { name: true } } }, orderBy: { startDate: "desc" } });
// }

// export async function createTrainingProgram(data: { schoolId: string; title: string; description?: string; trainingType: TrainingType; provider?: string; venue?: string; isOnline?: boolean; onlineLink?: string; startDate: Date; endDate: Date; totalHours?: number; maxParticipants?: number; cost?: number; costPerStaff?: number; targetRoles?: string[]; skills?: string[] }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };
//   const program = await db.trainingProgram.create({ data: { ...data, status: "PLANNED", targetRoles: data.targetRoles ?? [], skills: data.skills ?? [], createdById: user.id } });
//   revalidatePath(`/staff/training`);
//   return { ok: true, data: program, message: "Training program created" };
// }

// export async function enrollStaffInTraining(trainingId: string, staffIds: string[], schoolId: string): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const created = await db.$transaction(staffIds.map((staffId) => db.trainingParticipant.upsert({ where: { trainingId_staffId: { trainingId, staffId } }, update: { status: "PLANNED" }, create: { trainingId, staffId, schoolId, status: "PLANNED" } })));
//   revalidatePath(`/staff/training`);
//   return { ok: true, data: { enrolled: created.length }, message: `${created.length} staff enrolled` };
// }

// export async function updateTrainingParticipant(trainingId: string, staffId: string, data: { status?: TrainingStatus; attendedHours?: number; completedAt?: Date; score?: number; passed?: boolean; certificateUrl?: string; feedback?: string }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const participant = await db.trainingParticipant.update({ where: { trainingId_staffId: { trainingId, staffId } }, data: { ...data, ...(data.certificateUrl && { certificateIssuedAt: new Date() }) } });
//   revalidatePath(`/staff/training`);
//   return { ok: true, data: participant, message: "Participant updated" };
// }

// export async function updateTrainingStatus(id: string, status: TrainingStatus): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const program = await db.trainingProgram.update({ where: { id }, data: { status } });
//   revalidatePath(`/staff/training`);
//   return { ok: true, data: program, message: "Training status updated" };
// }

// // ════════════════════════════════════════════════════════════════════════════
// // NOTICE BOARD
// // ════════════════════════════════════════════════════════════════════════════

// export async function getStaffNotices(schoolId: string, filters?: { status?: NoticeStatus; audience?: NoticeAudience }) {
//   return db.staffNotice.findMany({ where: { schoolId, ...(filters?.status && { status: filters.status }), ...(filters?.audience && { audience: filters.audience }) }, include: { createdBy: { select: { firstName: true, lastName: true } }, _count: { select: { acknowledgements: true } } }, orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }] });
// }

// export async function createStaffNotice(data: { schoolId: string; createdById: string; title: string; content: string; audience: NoticeAudience; isPinned?: boolean; priority?: string; targetRoleIds?: string[]; targetStaffIds?: string[]; publishedAt?: Date; expiresAt?: Date; attachmentUrls?: string[]; requiresAcknowledgement?: boolean }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const status: NoticeStatus = data.publishedAt ? "PUBLISHED" : "DRAFT";
//   const notice = await db.staffNotice.create({ data: { ...data, status, targetRoleIds: data.targetRoleIds ?? [], targetStaffIds: data.targetStaffIds ?? [], attachmentUrls: data.attachmentUrls ?? [] } });
//   revalidatePath(`/staff/notices`);
//   return { ok: true, data: notice, message: "Notice created" };
// }

// export async function publishNotice(id: string): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const notice = await db.staffNotice.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
//   revalidatePath(`/staff/notices`);
//   return { ok: true, data: notice, message: "Notice published" };
// }

// export async function acknowledgeNotice(noticeId: string, staffId: string, schoolId: string): Promise<ActionResponse> {
//   const ack = await db.noticeAcknowledgement.upsert({ where: { noticeId_staffId: { noticeId, staffId } }, update: {}, create: { noticeId, staffId, schoolId } });
//   return { ok: true, data: ack, message: "Notice acknowledged" };
// }

// // ════════════════════════════════════════════════════════════════════════════
// // EXIT / OFFBOARDING
// // ════════════════════════════════════════════════════════════════════════════

// export async function getExitRecords(schoolId: string, filters?: { status?: ExitStatus }) {
//   return db.exitRecord.findMany({
//     where: { schoolId, ...(filters?.status && { status: filters.status }) },
//     include: { staff: { select: { firstName: true, lastName: true, staffId: true } }, interviewConductedBy: { select: { name: true } }, approvedBy: { select: { name: true } } },
//     orderBy: { createdAt: "desc" },
//   });
// }

// export async function initiateOffboarding(data: { staffId: string; schoolId: string; exitType: ExitType; exitDate: Date; noticeDate?: Date; lastWorkingDay?: Date }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user) return { ok: false, message: "Unauthorized" };
//   const existing = await db.exitRecord.findUnique({ where: { staffId: data.staffId } });
//   if (existing) return { ok: false, message: "An offboarding record already exists for this staff member." };
//   const exitRecord = await db.$transaction(async (tx) => {
//     const record = await tx.exitRecord.create({ data: { ...data, status: "INITIATED" } });
//     await tx.staff.update({ where: { id: data.staffId }, data: { status: "RESIGNED" } });
//     return record;
//   });
//   revalidatePath(`/staff/offboarding`);
//   return { ok: true, data: exitRecord, message: "Offboarding initiated" };
// }

// export async function completeOffboarding(staffId: string, data: { finalSalaryPaid?: boolean; gratuityAmount?: number; gratuityPaid?: boolean; noticePeriodPaid?: boolean; otherSettlementNotes?: string; experienceLetterIssued?: boolean; experienceLetterUrl?: string; releasingLetterIssued?: boolean; releasingLetterUrl?: string; recommendationIssued?: boolean }): Promise<ActionResponse> {
//   const user = await getAuthenticatedUser();
//   if (!user?.id) return { ok: false, message: "Unauthorized" };
//   const record = await db.exitRecord.update({ where: { staffId }, data: { ...data, status: "COMPLETED", approvedById: user.id, approvedAt: new Date(), completedAt: new Date() } });
//   revalidatePath(`/staff/offboarding`);
//   return { ok: true, data: record, message: "Offboarding completed" };
// }

// // ════════════════════════════════════════════════════════════════════════════
// // DASHBOARD STATS
// // ════════════════════════════════════════════════════════════════════════════

// export async function getStaffDashboardStats(schoolId: string) {
//   const [totalStaff, activeStaff, onLeave, teachingStaff, pendingLeave, pendingPayroll, pendingDisc, expiringDocs, pendingLoans] = await Promise.all([
//     db.staff.count({ where: { schoolId } }),
//     db.staff.count({ where: { schoolId, status: "ACTIVE" } }),
//     db.staff.count({ where: { schoolId, status: "ON_LEAVE" } }),
//     db.staff.count({ where: { schoolId, staffType: "TEACHING", status: "ACTIVE" } }),
//     db.leaveRequest.count({ where: { schoolId, status: "PENDING" } }),
//     db.payrollBatch.count({ where: { schoolId, status: { in: ["DRAFT", "REVIEW"] } } }),
//     db.disciplinaryRecord.count({ where: { schoolId, status: { in: ["OPEN", "UNDER_INVESTIGATION"] } } }),
//     db.staffDocument.count({ where: { schoolId, expiryDate: { lte: new Date(Date.now() + 30 * 86400000), gte: new Date() } } }),
//     db.staffLoan.count({ where: { schoolId, status: "PENDING" } }),
//   ]);

//   return {
//     totalStaff, activeStaff, onLeave,
//     teachingStaff, nonTeachingStaff: activeStaff - teachingStaff,
//     pendingLeaveRequests: pendingLeave,
//     pendingPayrollBatch: pendingPayroll,
//     pendingDisciplinary: pendingDisc,
//     expiringDocuments: expiringDocs,
//     pendingLoans,
//   };
// }

// export async function getPayrollSummary(schoolId: string, payYear: number) {
//   const batches = await db.payrollBatch.findMany({ where: { schoolId, payYear }, orderBy: { payMonth: "asc" } });
//   return {
//     year: payYear,
//     months: batches.map((b) => ({ month: b.payMonth, period: b.payPeriod, status: b.status, totalStaff: b.totalStaffCount, totalGross: b.totalGrossSalary, totalNet: b.totalNetSalary, totalNSSF: b.totalNSSF, totalPAYE: b.totalPAYE })),
//     yearlyTotals: { totalGross: batches.reduce((s, b) => s + b.totalGrossSalary, 0), totalNet: batches.reduce((s, b) => s + b.totalNetSalary, 0), totalNSSF: batches.reduce((s, b) => s + b.totalNSSF, 0), totalPAYE: batches.reduce((s, b) => s + b.totalPAYE, 0) },
//   };
// }





"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/prisma/db";
import bcrypt from "bcryptjs";
// FIX [1]: TeacherStatus moved here as a VALUE import (not type).
// The mid-file duplicate `import { TeacherStatus } from "@prisma/client"` below has been removed.
import { UserType, TeacherStatus } from "@prisma/client";
import type {
  StaffStatus,
  StaffType,
  EmploymentType,
  StaffRoleType,
  ContractType,
  AttendanceStatus,
  OvertimeStatus,
  PayrollItemType,
  LoanStatus,
  SalaryAdvanceStatus,
  AppraisalStatus,
  AppraisalRating,
  DisciplinaryType,
  DisciplinaryStatus,
  GrievanceStatus,
  DocumentCategory,
  TrainingStatus,
  TrainingType,
  NoticeAudience,
  NoticeStatus,
  LeaveType,
  LeaveStatus,
  ExitType,
  ExitStatus,
  ExpensePaymentMethod,
  AllowanceType,
  DeductionType,
} from "@prisma/client";
import { getAuthenticatedUser } from "@/config/useAuth";

// ─── RESPONSE TYPE ────────────────────────────────────────────────────────────

type ActionResponse<T = any> = {
  ok: boolean;
  message: string;
  data?: T;
};

// ─── ID GENERATORS ───────────────────────────────────────────────────────────

async function generateStaffId(schoolId: string): Promise<string> {
  const school = await db.school.findUnique({
    where:  { id: schoolId },
    select: { code: true },
  });
  const schoolCode = (school?.code ?? "SCH").slice(0, 3).toUpperCase();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStr = String(month).padStart(2, "0");
  const prefix = `${schoolCode}STF${year}${monthStr}`;

  const latest = await db.staff.findFirst({
    where: { schoolId, staffId: { startsWith: prefix } },
    orderBy: { staffId: "desc" },
    select: { staffId: true },
  });

  let seq = 1;
  if (latest?.staffId) {
    const suffix = latest.staffId.slice(prefix.length);
    const parsed = parseInt(suffix, 10);
    if (!isNaN(parsed)) seq = parsed + 1;
  }

  let candidate = `${prefix}${String(seq).padStart(3, "0")}`;
  while (true) {
    const conflict = await db.user.findUnique({
      where: { schoolId_loginId: { schoolId, loginId: candidate } },
    });
    if (!conflict) break;
    seq += 1;
    candidate = `${prefix}${String(seq).padStart(3, "0")}`;
  }

  return candidate;
}

async function generateContractNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.staffContract.count({ where: { schoolId } });
  return `CON${year}${String(count + 1).padStart(4, "0")}`;
}

async function generateAdvanceNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.salaryAdvance.count({ where: { schoolId } });
  return `ADV${year}${String(count + 1).padStart(4, "0")}`;
}

async function generateLoanNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.staffLoan.count({ where: { schoolId } });
  return `LOAN${year}${String(count + 1).padStart(4, "0")}`;
}

async function generateBatchNumber(payMonth: number, payYear: number): Promise<string> {
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `BATCH-${months[payMonth - 1]}-${payYear}`;
}

async function generateDisciplinaryCase(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.disciplinaryRecord.count({ where: { schoolId } });
  return `DISC${year}${String(count + 1).padStart(4, "0")}`;
}

async function generateGrievanceCase(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.grievanceRecord.count({ where: { schoolId } });
  return `GRIEV${year}${String(count + 1).padStart(4, "0")}`;
}

// ════════════════════════════════════════════════════════════════════════════
// STAFF ROLE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

export async function getStaffRoleDefinitions(schoolId: string) {
  return db.staffRoleDefinition.findMany({
    where: { schoolId, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createStaffRoleDefinition(data: {
  schoolId: string;
  roleType: StaffRoleType;
  name: string;
  code: string;
  description?: string;
  permissions?: string[];
  dashboardPath?: string;
}): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };

  const role = await db.staffRoleDefinition.create({
    data: { ...data, code: data.code.toUpperCase(), permissions: data.permissions ?? [] },
  });

  revalidatePath(`/staff/roles`);
  return { ok: true, data: role, message: "Role created" };
}

export async function updateStaffRoleDefinition(
  id: string,
  data: {
    name?: string;
    description?: string;
    permissions?: string[];
    dashboardPath?: string;
    isActive?: boolean;
  }
): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };

  const role = await db.staffRoleDefinition.update({ where: { id }, data });
  revalidatePath(`/staff/roles`);
  return { ok: true, data: role, message: "Role updated" };
}

// ════════════════════════════════════════════════════════════════════════════
// STAFF CORE — READ
// ════════════════════════════════════════════════════════════════════════════

export async function getStaff(
  schoolId: string,
  filters?: { status?: StaffStatus; staffType?: StaffType; search?: string }
) {
  return db.staff.findMany({
    where: {
      schoolId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.staffType && { staffType: filters.staffType }),
      ...(filters?.search && {
        OR: [
          { firstName: { contains: filters.search, mode: "insensitive" } },
          { lastName: { contains: filters.search, mode: "insensitive" } },
          { staffId: { contains: filters.search, mode: "insensitive" } },
          { phone: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      user: {
        select: {
          id: true, loginId: true, userType: true,
          status: true, email: true, phone: true, image: true,
        },
      },
      roles: { where: { isActive: true }, include: { roleDefinition: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStaffById(id: string) {
  return db.staff.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true, name: true, loginId: true, userType: true,
          status: true, email: true, phone: true, image: true,
        },
      },
      roles: { include: { roleDefinition: true } },
      contracts: { orderBy: { createdAt: "desc" }, take: 1 },
      leaveBalances: true,
      allowanceProfiles: { where: { isActive: true } },
      deductionProfiles: { where: { isActive: true } },
    },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// STAFF CORE — CREATE INPUT TYPE
// ════════════════════════════════════════════════════════════════════════════

export type CreateStaffInput = {
  schoolId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender: string;
  dob?: Date;
  nationality?: string;
  nationalId?: string;
  address?: string;
  imageUrl?: string;
  staffType: StaffType;
  employmentType: EmploymentType;
  dateOfHire: Date;
  basicSalary?: number;
  salaryGrade?: string;
  bankName?: string;
  bankAccount?: string;
  mobileMoneyPhone?: string;
  paymentMethod?: ExpensePaymentMethod;
  highestQualification?: string;
  institutionAttended?: string;
  specialization?: string;
  nssfNumber?: string;
  tinNumber?: string;
  emergencyName?: string;
  emergencyRelationship?: string;
  emergencyPhone?: string;
  roleDefinitionId?: string;
  password?: string;
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function toTeacherStatus(staffStatus: StaffStatus): TeacherStatus {
  const map: Record<string, TeacherStatus> = {
    ACTIVE:         TeacherStatus.ACTIVE,
    ON_LEAVE:       TeacherStatus.ON_LEAVE,
    SUSPENDED:      TeacherStatus.SUSPENDED,
    RESIGNED:       TeacherStatus.RESIGNED,
    TERMINATED:     TeacherStatus.TERMINATED,
    RETIRED:        TeacherStatus.RETIRED,
    CONTRACT_ENDED: TeacherStatus.TERMINATED,
  };
  return map[staffStatus] ?? TeacherStatus.ACTIVE;
}

function toTeacherStaffNo(staffId: string): string {
  return staffId.replace(/^STF/, "TCH");
}

// ════════════════════════════════════════════════════════════════════════════
// STAFF CORE — CREATE  (with Teacher auto-creation)
// ════════════════════════════════════════════════════════════════════════════

export async function createStaff(input: CreateStaffInput): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  const {
    schoolId, firstName, lastName, phone, email, password, roleDefinitionId,
    ...staffFields
  } = input;

  const school = await db.school.findUnique({ where: { id: schoolId }, select: { id: true } });
  if (!school) {
    return { ok: false, message: "School not found. Ensure a valid school ID is provided." };
  }

  try {
    const [phoneExists, emailExists] = await Promise.all([
      db.staff.findFirst({ where: { schoolId, phone } }),
      email ? db.staff.findFirst({ where: { schoolId, email } }) : null,
    ]);

    if (phoneExists) return { ok: false, message: `Phone ${phone} is already used by another staff member in this school.` };
    if (emailExists) return { ok: false, message: `Email ${email} is already used by another staff member in this school.` };

    const staffId = await generateStaffId(schoolId);
    const loginId = staffId;

    const loginIdTaken = await db.user.findUnique({
      where: { schoolId_loginId: { schoolId, loginId } },
    });
    if (loginIdTaken) return { ok: false, message: "Generated login ID conflict — please retry." };

    const plainPassword = password ?? phone;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const fullName = `${firstName} ${lastName}`.trim();

    const result = await db.$transaction(async (tx) => {
      // ── 3. User ────────────────────────────────────────────────────────
      const newUser = await tx.user.create({
        data: {
          name: fullName, firstName, lastName, phone,
          email: email ?? null,
          password: hashedPassword,
          userType: UserType.STAFF,
          loginId, schoolId,
          status: true,
          isVerfied: false,
        },
      });

      // ── 4. Staff ───────────────────────────────────────────────────────
      const staff = await tx.staff.create({
        data: {
          staffId, schoolId, userId: newUser.id,
          firstName, lastName, phone,
          email: email ?? null,
          basicSalary: staffFields.basicSalary ?? 0,
          dateOfHire: staffFields.dateOfHire,
          staffType: staffFields.staffType,
          employmentType: staffFields.employmentType,
          gender: staffFields.gender,
          dob: staffFields.dob,
          nationality: staffFields.nationality,
          nationalId: staffFields.nationalId,
          address: staffFields.address,
          imageUrl: staffFields.imageUrl,
          salaryGrade: staffFields.salaryGrade,
          bankName: staffFields.bankName,
          bankAccount: staffFields.bankAccount,
          mobileMoneyPhone: staffFields.mobileMoneyPhone,
          paymentMethod: staffFields.paymentMethod,
          highestQualification: staffFields.highestQualification,
          institutionAttended: staffFields.institutionAttended,
          specialization: staffFields.specialization,
          nssfNumber: staffFields.nssfNumber,
          tinNumber: staffFields.tinNumber,
          emergencyName: staffFields.emergencyName,
          emergencyRelationship: staffFields.emergencyRelationship,
          emergencyPhone: staffFields.emergencyPhone,
        },
      });

      // ── 4b. Teacher auto-creation for TEACHING staff ───────────────────
      if (staffFields.staffType === "TEACHING") {
        const teacherStaffNo = toTeacherStaffNo(staffId);

        const [tPhone, tEmail] = await Promise.all([
          phone ? tx.teacher.findUnique({ where: { phone } }) : null,
          email ? tx.teacher.findUnique({ where: { email } }) : null,
        ]);

        if (!tPhone && !tEmail) {
          await tx.teacher.create({
            data: {
              userId:               newUser.id,
              schoolId,
              staffNo:              teacherStaffNo,
              staffId:              staff.id,
              firstName,
              lastName,
              gender:               staffFields.gender ?? "Unknown",
              dateOfBirth:          staffFields.dob ?? staffFields.dateOfHire,
              phone,
              email:                email ?? `${staffId.toLowerCase()}@staff.local`,
              nationality:          staffFields.nationality ?? null,
              address:              staffFields.address ?? null,
              emergencyContactName: staffFields.emergencyName ?? null,
              emergencyRelationship: staffFields.emergencyRelationship ?? null,
              emergencyPhone:       staffFields.emergencyPhone ?? null,
              highestQualification: staffFields.highestQualification ?? null,
              specialization:       staffFields.specialization ?? null,
              profilePhoto:         staffFields.imageUrl ?? null,
              dateOfHire:           staffFields.dateOfHire,
              employmentType:       staffFields.employmentType as string,
              role:                 "TEACHER",
              currentStatus:        TeacherStatus.ACTIVE,
              status:               TeacherStatus.ACTIVE,
            },
          });

          // Connect the "teacher" User role so login redirect works correctly
          const teacherRole = await tx.role.upsert({
            where:  { roleName: "teacher" },
            create: {
              roleName:    "teacher",
              displayName: "Teacher",
              permissions: ["view_classes", "manage_marks", "view_students"],
            },
            update: {},
          });
          await tx.user.update({
            where: { id: newUser.id },
            data:  { roles: { connect: [{ id: teacherRole.id }] } },
          });

          // Also auto-assign the 'TEACHER' StaffRoleDefinition (for UI display)
          // Look up if a definition with code 'TEACHER' exists
          const teacherRoleDef = await tx.staffRoleDefinition.findFirst({
            where: { schoolId, code: "TEACHER", isActive: true }
          });
          
          if (teacherRoleDef && teacherRoleDef.id !== roleDefinitionId) {
            await tx.staffRole.create({
              data: {
                staffId: staff.id,
                staffRoleDefinitionId: teacherRoleDef.id,
                schoolId,
                isPrimary: !roleDefinitionId, // Set primary if no initial role was explicitly chosen
                isActive: true,
                assignedDate: new Date(),
              }
            });
          }
        }
      }

      // ── 5. Role ────────────────────────────────────────────────────────
      if (roleDefinitionId) {
        await tx.staffRole.create({
          data: {
            staffId: staff.id,
            staffRoleDefinitionId: roleDefinitionId,
            schoolId,
            isPrimary: true,
          },
        });

        // Also connect a matching system User.role so buildCapabilities
        // can detect DOS/HEAD/DEPUTY via systemRoles fallback
        const roleDef = await tx.staffRoleDefinition.findUnique({
          where:  { id: roleDefinitionId },
          select: { code: true, name: true },
        });
        if (roleDef) {
          const code = roleDef.code.toUpperCase();
          const DOS_CODES    = ["DOS", "DIRECTOR_OF_STUDIES"];
          const HEAD_CODES   = ["HEAD_TEACHER", "HEADTEACHER", "HEAD"];
          const DEPUTY_CODES = ["DEPUTY_HEAD", "DEPUTY"];

          let systemRoleName: string | null = null;
          let systemDisplayName: string | null = null;
          if (DOS_CODES.includes(code))    { systemRoleName = "dos";         systemDisplayName = "Director of Studies"; }
          else if (HEAD_CODES.includes(code))   { systemRoleName = "head_teacher"; systemDisplayName = "Head Teacher"; }
          else if (DEPUTY_CODES.includes(code)) { systemRoleName = "deputy";       systemDisplayName = "Deputy Head"; }

          if (systemRoleName) {
            const sysRole = await tx.role.upsert({
              where:  { roleName: systemRoleName },
              create: { roleName: systemRoleName, displayName: systemDisplayName!, permissions: [] },
              update: {},
            });
            await tx.user.update({
              where: { id: newUser.id },
              data:  { roles: { connect: [{ id: sysRole.id }] } },
            });
          }
        }
      }

      // ── 6. Employment history ──────────────────────────────────────────
      await tx.employmentHistory.create({
        data: {
          staffId: staff.id,
          schoolId,
          eventType: "HIRED",
          description: `${fullName} joined as ${staffFields.staffType}`,
          effectiveDate: staffFields.dateOfHire,
          newValue: {
            basicSalary: staffFields.basicSalary,
            employmentType: staffFields.employmentType,
          },
          performedById: user.id,
        },
      });

      return { staff, user: newUser };
    });

    revalidatePath("/staff");
    revalidatePath(`/dashboard/staff`);

    return {
      ok: true,
      message: `Staff ${fullName} created successfully.`,
      data: {
        staff: result.staff,
        loginCredentials: {
          loginId,
          password: plainPassword,
          userType: "STAFF",
          note: "The staff member should change their password after first login.",
        },
      },
    };
  } catch (error: any) {
    console.error("❌ createStaff:", error);
    if (error.code === "P2002") return { ok: false, message: "Duplicate record — check phone, email or national ID." };
    if (error.code === "P2003") return { ok: false, message: "Invalid school reference. Please contact support." };
    return { ok: false, message: error?.message ?? "Failed to create staff member." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// STAFF CORE — UPDATE  (syncs to Teacher if linked)
// ════════════════════════════════════════════════════════════════════════════

export async function updateStaff(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    gender?: string;
    dob?: Date;
    nationality?: string;
    nationalId?: string;
    address?: string;
    imageUrl?: string;
    basicSalary?: number;
    salaryGrade?: string;
    bankName?: string;
    bankAccount?: string;
    bankBranch?: string;
    mobileMoneyPhone?: string;
    paymentMethod?: ExpensePaymentMethod;
    highestQualification?: string;
    specialization?: string;
    nssfNumber?: string;
    tinNumber?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelationship?: string;
  }
): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  try {
    const existing = await db.staff.findUniqueOrThrow({
      where: { id },
      include: { teacher: { select: { id: true } } },
    });

    const staff = await db.$transaction(async (tx) => {
      const updated = await tx.staff.update({ where: { id }, data });

      // Sync User
      const userUpdate: Record<string, any> = {};
      if (data.firstName || data.lastName) {
        userUpdate.firstName = data.firstName ?? existing.firstName;
        userUpdate.lastName  = data.lastName  ?? existing.lastName;
        userUpdate.name = `${userUpdate.firstName} ${userUpdate.lastName}`;
      }
      if (data.phone) userUpdate.phone = data.phone;
      if (data.email !== undefined) userUpdate.email = data.email ?? null;

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({ where: { id: existing.userId }, data: userUpdate });
      }

      // Sync Teacher if linked
      if (existing.teacher) {
        const teacherUpdate: Record<string, any> = {};

        if (data.firstName !== undefined)            teacherUpdate.firstName            = data.firstName;
        if (data.lastName  !== undefined)            teacherUpdate.lastName             = data.lastName;
        if (data.gender    !== undefined)            teacherUpdate.gender               = data.gender;
        if (data.dob       !== undefined)            teacherUpdate.dateOfBirth          = data.dob;
        if (data.nationality !== undefined)          teacherUpdate.nationality          = data.nationality;
        if (data.address   !== undefined)            teacherUpdate.address              = data.address;
        if (data.phone     !== undefined)            teacherUpdate.phone                = data.phone;
        if (data.email     !== undefined)            teacherUpdate.email                = data.email;
        if (data.imageUrl  !== undefined)            teacherUpdate.profilePhoto         = data.imageUrl;
        if (data.highestQualification !== undefined) teacherUpdate.highestQualification = data.highestQualification;
        if (data.specialization !== undefined)       teacherUpdate.specialization       = data.specialization;
        if (data.emergencyName !== undefined)        teacherUpdate.emergencyContactName = data.emergencyName;
        if (data.emergencyPhone !== undefined)       teacherUpdate.emergencyPhone       = data.emergencyPhone;
        if (data.emergencyRelationship !== undefined) teacherUpdate.emergencyRelationship = data.emergencyRelationship;

        if (Object.keys(teacherUpdate).length > 0) {
          await tx.teacher.update({ where: { id: existing.teacher.id }, data: teacherUpdate });
        }
      }

      // Salary history
      if (data.basicSalary !== undefined && data.basicSalary !== existing.basicSalary) {
        await tx.employmentHistory.create({
          data: {
            staffId: id,
            schoolId: existing.schoolId,
            eventType: "SALARY_REVISED",
            description: "Salary revised",
            effectiveDate: new Date(),
            previousValue: { basicSalary: existing.basicSalary },
            newValue: { basicSalary: data.basicSalary },
            performedById: user.id,
          },
        });
      }

      return updated;
    });

    revalidatePath(`/staff/${id}`);
    return { ok: true, data: staff, message: "Staff updated successfully" };
  } catch (error: any) {
    console.error("❌ updateStaff:", error);
    return { ok: false, message: error?.message ?? "Failed to update staff" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// STAFF STATUS UPDATE  (syncs to Teacher if linked)
// ════════════════════════════════════════════════════════════════════════════

export async function updateStaffStatus(
  id: string,
  status: StaffStatus,
  reason?: string
): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  try {
    const existing = await db.staff.findUniqueOrThrow({
      where: { id },
      include: { teacher: { select: { id: true } } },
    });

    const staff = await db.$transaction(async (tx) => {
      const updated = await tx.staff.update({ where: { id }, data: { status } });

      const userActive = ["ACTIVE", "ON_LEAVE"].includes(status);
      await tx.user.update({ where: { id: existing.userId }, data: { status: userActive } });

      if (existing.teacher) {
        const teacherStatus = toTeacherStatus(status);
        await tx.teacher.update({
          where: { id: existing.teacher.id },
          data: {
            currentStatus: teacherStatus,
            status: teacherStatus,
            ...(["RESIGNED", "TERMINATED", "RETIRED"].includes(status) && {
              exitDate:   new Date(),
              exitReason: reason ?? `${status} via HR module`,
            }),
          },
        });
      }

      await tx.employmentHistory.create({
        data: {
          staffId: id,
          schoolId: existing.schoolId,
          eventType: "STATUS_CHANGED",
          description: reason ?? `Status changed to ${status}`,
          effectiveDate: new Date(),
          previousValue: { status: existing.status },
          newValue: { status },
          performedById: user.id,
        },
      });

      return updated;
    });

    revalidatePath(`/staff/${id}`);
    return { ok: true, data: staff, message: `Status changed to ${status}` };
  } catch (error: any) {
    console.error("❌ updateStaffStatus:", error);
    return { ok: false, message: error?.message ?? "Failed to update status" };
  }
}

export async function resetStaffPassword(
  staffId: string,
  newPassword?: string
): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  try {
    const staff = await db.staff.findUnique({
      where: { id: staffId },
      select: { userId: true, phone: true, firstName: true, lastName: true },
    });
    if (!staff) return { ok: false, message: "Staff not found" };

    const plain = newPassword ?? staff.phone;
    const hashed = await bcrypt.hash(plain, 10);

    await db.user.update({ where: { id: staff.userId }, data: { password: hashed } });

    return {
      ok: true,
      data: { temporaryPassword: plain },
      message: `Password reset for ${staff.firstName} ${staff.lastName}. New password: ${plain}`,
    };
  } catch (error: any) {
    console.error("❌ resetStaffPassword:", error);
    return { ok: false, message: error?.message ?? "Failed to reset password" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ROLE ASSIGNMENT
// ════════════════════════════════════════════════════════════════════════════

export async function assignStaffRole(data: {
  staffId: string;
  staffRoleDefinitionId: string;
  schoolId: string;
  isPrimary?: boolean;
  notes?: string;
}): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };

  if (data.isPrimary) {
    await db.staffRole.updateMany({
      where: { staffId: data.staffId, schoolId: data.schoolId },
      data: { isPrimary: false },
    });
  }

  const role = await db.staffRole.upsert({
    where: {
      staffId_staffRoleDefinitionId: {
        staffId: data.staffId,
        staffRoleDefinitionId: data.staffRoleDefinitionId,
      },
    },
    update: { isActive: true, isPrimary: data.isPrimary ?? false, notes: data.notes },
    create: {
      staffId: data.staffId,
      staffRoleDefinitionId: data.staffRoleDefinitionId,
      schoolId: data.schoolId,
      isPrimary: data.isPrimary ?? false,
      notes: data.notes,
    },
  });

  // Sync system User.role so buildCapabilities detects DOS/HEAD/DEPUTY via systemRoles fallback
  const staffRecord = await db.staff.findUnique({
    where:  { id: data.staffId },
    select: { userId: true },
  });
  if (staffRecord) {
    const roleDef = await db.staffRoleDefinition.findUnique({
      where:  { id: data.staffRoleDefinitionId },
      select: { code: true, name: true },
    });
    if (roleDef) {
      const code = roleDef.code.toUpperCase();
      const DOS_CODES    = ["DOS", "DIRECTOR_OF_STUDIES"];
      const HEAD_CODES   = ["HEAD_TEACHER", "HEADTEACHER", "HEAD"];
      const DEPUTY_CODES = ["DEPUTY_HEAD", "DEPUTY"];

      let systemRoleName: string | null = null;
      let systemDisplayName: string | null = null;
      if (DOS_CODES.includes(code))         { systemRoleName = "dos";         systemDisplayName = "Director of Studies"; }
      else if (HEAD_CODES.includes(code))   { systemRoleName = "head_teacher"; systemDisplayName = "Head Teacher"; }
      else if (DEPUTY_CODES.includes(code)) { systemRoleName = "deputy";       systemDisplayName = "Deputy Head"; }

      if (systemRoleName) {
        const sysRole = await db.role.upsert({
          where:  { roleName: systemRoleName },
          create: { roleName: systemRoleName, displayName: systemDisplayName!, permissions: [] },
          update: {},
        });
        await db.user.update({
          where: { id: staffRecord.userId },
          data:  { roles: { connect: [{ id: sysRole.id }] } },
        });
      }
    }
  }

  revalidatePath(`/staff/${data.staffId}`);
  return { ok: true, data: role, message: "Role assigned" };
}

export async function removeStaffRole(
  staffId: string,
  staffRoleDefinitionId: string
): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };

  await db.staffRole.update({
    where: { staffId_staffRoleDefinitionId: { staffId, staffRoleDefinitionId } },
    data: { isActive: false, endDate: new Date() },
  });

  revalidatePath(`/staff/${staffId}`);
  return { ok: true, message: "Role removed" };
}

// ════════════════════════════════════════════════════════════════════════════
// CONTRACTS & EMPLOYMENT HISTORY
// ════════════════════════════════════════════════════════════════════════════

export async function getStaffContracts(staffId: string) {
  return db.staffContract.findMany({
    where: { staffId },
    include: { issuedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createStaffContract(data: {
  staffId: string;
  schoolId: string;
  contractType: ContractType;
  title: string;
  startDate: Date;
  endDate?: Date;
  probationEndDate?: Date;
  noticePeriodDays?: number;
  basicSalary: number;
  salaryGrade?: string;
  employmentType: EmploymentType;
  termsAndConditions?: string;
  jobDescription?: string;
  workingHoursPerWeek?: number;
  documentUrl?: string;
  renewedFromId?: string;
}): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  const contractNumber = await generateContractNumber(data.schoolId);
  const contract = await db.staffContract.create({
    data: { ...data, contractNumber, status: "DRAFT", issuedById: user.id },
  });

  revalidatePath(`/staff/${data.staffId}/contracts`);
  return { ok: true, data: contract, message: "Contract created" };
}

export async function activateContract(id: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };

  const contract = await db.staffContract.update({ where: { id }, data: { status: "ACTIVE" } });
  revalidatePath(`/staff/${contract.staffId}/contracts`);
  return { ok: true, data: contract, message: "Contract activated" };
}

export async function signContractAsStaff(id: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };

  const contract = await db.staffContract.update({
    where: { id },
    data: { signedByStaff: true, staffSignedAt: new Date() },
  });
  revalidatePath(`/staff/${contract.staffId}/contracts`);
  return { ok: true, data: contract, message: "Contract signed" };
}

export async function getEmploymentHistory(staffId: string) {
  return db.employmentHistory.findMany({
    where: { staffId },
    include: { performedBy: { select: { name: true } } },
    orderBy: { effectiveDate: "desc" },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// ATTENDANCE
// ════════════════════════════════════════════════════════════════════════════

export async function getAttendanceRecords(
  schoolId: string,
  filters?: { staffId?: string; from?: Date; to?: Date; status?: AttendanceStatus }
) {
  return db.attendanceRecord.findMany({
    where: {
      schoolId,
      ...(filters?.staffId && { staffId: filters.staffId }),
      ...(filters?.status && { status: filters.status }),
      ...((filters?.from || filters?.to) && {
        date: {
          ...(filters.from && { gte: filters.from }),
          ...(filters.to && { lte: filters.to }),
        },
      }),
    },
    include: {
      staff: { select: { firstName: true, lastName: true, staffId: true } },
      enteredBy: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });
}

export async function markAttendance(data: {
  staffId: string;
  schoolId: string;
  date: Date;
  status: AttendanceStatus;
  checkInTime?: Date;
  checkOutTime?: Date;
  lateMinutes?: number;
  lateReason?: string;
  absenceReason?: string;
  leaveRequestId?: string;
  notes?: string;
}): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  const hoursWorked =
    data.checkInTime && data.checkOutTime
      ? (data.checkOutTime.getTime() - data.checkInTime.getTime()) / 3600000
      : undefined;

  const record = await db.attendanceRecord.upsert({
    where: { staffId_date: { staffId: data.staffId, date: data.date } },
    update: { ...data, hoursWorked, isManualEntry: true, enteredById: user.id },
    create: { ...data, hoursWorked, isManualEntry: true, enteredById: user.id },
  });

  revalidatePath(`/staff/attendance`);
  return { ok: true, data: record, message: "Attendance recorded" };
}

export async function bulkMarkAttendance(
  schoolId: string,
  date: Date,
  records: Array<{
    staffId: string;
    status: AttendanceStatus;
    checkInTime?: Date;
    checkOutTime?: Date;
    lateMinutes?: number;
    notes?: string;
  }>
): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  const results = await db.$transaction(
    records.map((r) =>
      db.attendanceRecord.upsert({
        where: { staffId_date: { staffId: r.staffId, date } },
        update: { ...r, isManualEntry: true, enteredById: user.id },
        create: { ...r, schoolId, date, isManualEntry: true, enteredById: user.id },
      })
    )
  );

  revalidatePath(`/staff/attendance`);
  return { ok: true, data: { count: results.length }, message: `${results.length} records saved` };
}

export async function computeAttendanceSummary(
  staffId: string,
  schoolId: string,
  month: number,
  year: number
): Promise<ActionResponse> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const [records, overtimeRecords] = await Promise.all([
    db.attendanceRecord.findMany({ where: { staffId, date: { gte: startDate, lte: endDate } } }),
    db.overtimeRequest.findMany({
      where: { staffId, status: "APPROVED", date: { gte: startDate, lte: endDate } },
    }),
  ]);

  const summary = {
    staffId, schoolId, month, year,
    totalWorkingDays: records.filter((r) => !["PUBLIC_HOLIDAY", "WEEKEND"].includes(r.status)).length,
    presentDays:  records.filter((r) => r.status === "PRESENT").length,
    absentDays:   records.filter((r) => r.status === "ABSENT").length,
    lateDays:     records.filter((r) => r.status === "LATE").length,
    halfDays:     records.filter((r) => r.status === "HALF_DAY").length * 0.5,
    leaveDays:    records.filter((r) => r.status === "ON_LEAVE").length,
    publicHolidays: records.filter((r) => r.status === "PUBLIC_HOLIDAY").length,
    totalHoursWorked:  records.reduce((s, r) => s + (r.hoursWorked ?? 0), 0),
    totalOvertimeHours: overtimeRecords.reduce((s, r) => s + r.hoursWorked, 0),
    attendancePercentage:
      records.length > 0
        ? (records.filter((r) => r.status === "PRESENT").length / records.length) * 100
        : 0,
    computedAt: new Date(),
  };

  await db.attendanceSummary.upsert({
    where: { staffId_month_year: { staffId, month, year } },
    update: summary,
    create: summary,
  });

  return { ok: true, data: summary, message: "Attendance summary computed" };
}

// ════════════════════════════════════════════════════════════════════════════
// OVERTIME
// ════════════════════════════════════════════════════════════════════════════

export async function getOvertimeRequests(
  schoolId: string,
  filters?: { staffId?: string; status?: OvertimeStatus }
) {
  return db.overtimeRequest.findMany({
    where: {
      schoolId,
      ...(filters?.staffId && { staffId: filters.staffId }),
      ...(filters?.status && { status: filters.status }),
    },
    include: {
      staff: { select: { firstName: true, lastName: true, staffId: true } },
      approvedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOvertimeRequest(data: {
  staffId: string;
  schoolId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  hoursWorked: number;
  description: string;
  compensationMethod?: string;
}): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };

  const request = await db.overtimeRequest.create({
    data: { ...data, status: "PENDING", compensationMethod: data.compensationMethod ?? "PAYMENT" },
  });

  revalidatePath(`/staff/overtime`);
  return { ok: true, data: request, message: "Overtime request submitted" };
}

export async function approveOvertimeRequest(id: string, amountPayable?: number): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  const request = await db.overtimeRequest.update({
    where: { id },
    data: { status: "APPROVED", amountPayable, approvedById: user.id, approvedAt: new Date() },
  });

  revalidatePath(`/staff/overtime`);
  return { ok: true, data: request, message: "Overtime approved" };
}

export async function rejectOvertimeRequest(id: string, reason: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  const request = await db.overtimeRequest.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: reason, approvedById: user.id },
  });

  revalidatePath(`/staff/overtime`);
  return { ok: true, data: request, message: "Overtime rejected" };
}

// ════════════════════════════════════════════════════════════════════════════
// LEAVE MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════

export async function getLeaveBalances(staffId: string, year: number) {
  return db.leaveBalance.findMany({ where: { staffId, year } });
}

export async function initLeaveBalances(
  staffId: string,
  schoolId: string,
  year: number
): Promise<ActionResponse> {
  const defaults: Array<{ leaveType: LeaveType; entitled: number }> = [
    { leaveType: "ANNUAL",        entitled: 21 },
    { leaveType: "SICK",          entitled: 10 },
    { leaveType: "MATERNITY",     entitled: 60 },
    { leaveType: "PATERNITY",     entitled: 4  },
    { leaveType: "COMPASSIONATE", entitled: 3  },
    { leaveType: "STUDY",         entitled: 5  },
  ];

  const records = await db.$transaction(
    defaults.map((d) =>
      db.leaveBalance.upsert({
        where: { staffId_leaveType_year: { staffId, leaveType: d.leaveType, year } },
        update: {},
        create: { staffId, schoolId, year, ...d, remaining: d.entitled },
      })
    )
  );

  return { ok: true, data: records, message: "Leave balances initialized" };
}

export async function getLeaveRequests(
  schoolId: string,
  filters?: { staffId?: string; status?: LeaveStatus; leaveType?: LeaveType }
) {
  return db.leaveRequest.findMany({
    where: {
      schoolId,
      ...(filters?.staffId && { staffId: filters.staffId }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.leaveType && { leaveType: filters.leaveType }),
    },
    include: {
      staff: { select: { firstName: true, lastName: true, staffId: true } },
      approvedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createLeaveRequest(data: {
  staffId: string;
  schoolId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  daysRequested: number;
  reason: string;
  attachmentUrl?: string;
  coverStaffId?: string;
}): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };

  const year = data.startDate.getFullYear();
  const balance = await db.leaveBalance.findUnique({
    where: { staffId_leaveType_year: { staffId: data.staffId, leaveType: data.leaveType, year } },
  });

  if (balance && data.daysRequested > balance.remaining) {
    return {
      ok: false,
      message: `Insufficient balance. Available: ${balance.remaining} days, Requested: ${data.daysRequested} days.`,
    };
  }

  const request = await db.$transaction(async (tx) => {
    const req = await tx.leaveRequest.create({ data: { ...data, status: "PENDING" } });
    if (balance) {
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: { pending: { increment: data.daysRequested } },
      });
    }
    return req;
  });

  revalidatePath(`/staff/leave`);
  return { ok: true, data: request, message: "Leave request submitted" };
}

export async function approveLeaveRequest(id: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  const leave = await db.leaveRequest.findUniqueOrThrow({ where: { id } });
  const year = leave.startDate.getFullYear();

  const request = await db.$transaction(async (tx) => {
    const updated = await tx.leaveRequest.update({
      where: { id },
      data: { status: "APPROVED", approvedById: user.id, approvedAt: new Date() },
    });
    await tx.leaveBalance.updateMany({
      where: { staffId: leave.staffId, leaveType: leave.leaveType, year },
      data: {
        used:      { increment: leave.daysRequested },
        pending:   { decrement: leave.daysRequested },
        remaining: { decrement: leave.daysRequested },
      },
    });
    return updated;
  });

  revalidatePath(`/staff/leave`);
  return { ok: true, data: request, message: "Leave approved" };
}

export async function rejectLeaveRequest(id: string, reason: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  const leave = await db.leaveRequest.findUniqueOrThrow({ where: { id } });
  const year = leave.startDate.getFullYear();

  const request = await db.$transaction(async (tx) => {
    const updated = await tx.leaveRequest.update({
      where: { id },
      data: { status: "REJECTED", rejectionReason: reason, approvedById: user.id },
    });
    await tx.leaveBalance.updateMany({
      where: { staffId: leave.staffId, leaveType: leave.leaveType, year },
      data: { pending: { decrement: leave.daysRequested } },
    });
    return updated;
  });

  revalidatePath(`/staff/leave`);
  return { ok: true, data: request, message: "Leave rejected" };
}

// ════════════════════════════════════════════════════════════════════════════
// ALLOWANCE & DEDUCTION PROFILES
// ════════════════════════════════════════════════════════════════════════════

export async function addAllowanceProfile(data: {
  staffId: string; schoolId: string; allowanceType: AllowanceType; name: string;
  amount: number; isPercentage?: boolean; effectiveFrom?: Date; effectiveUntil?: Date;
}): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const profile = await db.staffAllowanceProfile.create({ data });
  revalidatePath(`/staff/${data.staffId}`);
  return { ok: true, data: profile, message: "Allowance added" };
}

export async function updateAllowanceProfile(
  id: string, data: { amount?: number; isActive?: boolean; effectiveUntil?: Date }
): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const profile = await db.staffAllowanceProfile.update({ where: { id }, data });
  return { ok: true, data: profile, message: "Allowance updated" };
}

export async function addDeductionProfile(data: {
  staffId: string; schoolId: string; deductionType: DeductionType; name: string;
  amount: number; isPercentage?: boolean; effectiveFrom?: Date; effectiveUntil?: Date;
}): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const profile = await db.staffDeductionProfile.create({ data });
  revalidatePath(`/staff/${data.staffId}`);
  return { ok: true, data: profile, message: "Deduction added" };
}

export async function updateDeductionProfile(
  id: string, data: { amount?: number; isActive?: boolean; effectiveUntil?: Date }
): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const profile = await db.staffDeductionProfile.update({ where: { id }, data });
  return { ok: true, data: profile, message: "Deduction updated" };
}

// ════════════════════════════════════════════════════════════════════════════
// PAYROLL
// ════════════════════════════════════════════════════════════════════════════

function calculateUgandaPAYE(monthlyTaxable: number): number {
  const annual = monthlyTaxable * 12;
  let annualTax = 0;
  if (annual <= 2820000)       annualTax = 0;
  else if (annual <= 4020000)  annualTax = (annual - 2820000) * 0.1;
  else if (annual <= 4920000)  annualTax = 120000 + (annual - 4020000) * 0.2;
  else if (annual <= 120000000) annualTax = 300000 + (annual - 4920000) * 0.3;
  else                         annualTax = 35124000 + (annual - 120000000) * 0.4;
  return annualTax / 12;
}

export async function createPayrollBatch(data: {
  schoolId: string;
  payMonth: number;
  payYear: number;
}): Promise<ActionResponse> {
  // FIX [2]: removed debug console.log that was logging sensitive payroll data
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  const { schoolId, payMonth, payYear } = data;
  const payPeriod = new Date(payYear, payMonth - 1, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const existing = await db.payrollBatch.findUnique({
    where: { schoolId_payMonth_payYear: { schoolId, payMonth, payYear } },
  });
  if (existing) return { ok: false, message: `Payroll batch for ${payPeriod} already exists.` };

  const allStaff = await db.staff.findMany({
    where: { schoolId, status: "ACTIVE" },
    include: {
      allowanceProfiles: { where: { isActive: true } },
      deductionProfiles: { where: { isActive: true } },
    },
  });

  const batchNumber = await generateBatchNumber(payMonth, payYear);

  const result = await db.$transaction(async (tx) => {
    const batch = await tx.payrollBatch.create({
      data: {
        schoolId, batchNumber, payMonth, payYear, payPeriod,
        status: "DRAFT",
        totalStaffCount: allStaff.length,
        preparedById: user.id,
        preparedAt: new Date(),
      },
    });

    let totalGross = 0, totalNet = 0, totalAllowances = 0;
    let totalDeductions = 0, totalNSSF = 0, totalPAYE = 0;

    for (const staff of allStaff) {
      const [attendance, overtimeRecords, activeLoans, activeAdvances] = await Promise.all([
        tx.attendanceSummary.findUnique({
          where: { staffId_month_year: { staffId: staff.id, month: payMonth, year: payYear } },
        }),
        tx.overtimeRequest.findMany({
          where: {
            staffId: staff.id, status: "APPROVED",
            date: { gte: new Date(payYear, payMonth - 1, 1), lte: new Date(payYear, payMonth, 0) },
          },
        }),
        tx.staffLoan.findMany({ where: { staffId: staff.id, status: "ACTIVE" } }),
        tx.salaryAdvance.findMany({ where: { staffId: staff.id, status: "DISBURSED" } }),
      ]);

      const basicSalary = staff.basicSalary;
      const allowanceItems = staff.allowanceProfiles.map((a) => ({
        itemType: "ALLOWANCE" as PayrollItemType,
        allowanceType: a.allowanceType,
        name: a.name,
        amount: a.isPercentage ? (basicSalary * a.amount) / 100 : a.amount,
        isPercentage: a.isPercentage,
        percentageOf: a.isPercentage ? basicSalary : null,
      }));

      const totalAllowanceAmount = allowanceItems.reduce((s, i) => s + i.amount, 0);
      const grossSalary = basicSalary + totalAllowanceAmount;
      const overtimePay = overtimeRecords.reduce((s, r) => s + (r.amountPayable ?? 0), 0);
      const overtimeHours = overtimeRecords.reduce((s, r) => s + r.hoursWorked, 0);

      const nssfEmployee = grossSalary * 0.05;
      const nssfEmployer = grossSalary * 0.10;
      const monthlyTaxable = grossSalary - nssfEmployee;
      const payeAmount = calculateUgandaPAYE(monthlyTaxable);

      const loanDeductions = activeLoans.reduce((s, l) => s + (l.monthlyInstalment ?? 0), 0);
      const advanceDeductions = activeAdvances.reduce((s, a) => s + (a.monthlyRecovery ?? 0), 0);

      const workingDays = attendance?.totalWorkingDays ?? 22;
      const daysWorked = attendance?.presentDays ?? workingDays;
      const absentDays = attendance?.absentDays ?? 0;
      const absenceDeduction = absentDays * (basicSalary / workingDays);

      const deductionItems = [
        ...staff.deductionProfiles.map((d) => ({
          itemType: "DEDUCTION" as PayrollItemType,
          deductionType: d.deductionType,
          name: d.name,
          amount: d.isPercentage ? (basicSalary * d.amount) / 100 : d.amount,
          isPercentage: d.isPercentage,
          percentageOf: d.isPercentage ? basicSalary : null,
        })),
        { itemType: "DEDUCTION" as PayrollItemType, deductionType: "NSSF" as DeductionType,         name: "NSSF (5%)",       amount: nssfEmployee,      isPercentage: true,  percentageOf: grossSalary },
        { itemType: "DEDUCTION" as PayrollItemType, deductionType: "PAYE" as DeductionType,         name: "PAYE Tax",        amount: payeAmount,        isPercentage: false, percentageOf: null },
        ...(loanDeductions > 0    ? [{ itemType: "DEDUCTION" as PayrollItemType, deductionType: "LOAN_REPAYMENT" as DeductionType, name: "Loan Repayment",   amount: loanDeductions,    isPercentage: false, percentageOf: null }] : []),
        ...(advanceDeductions > 0 ? [{ itemType: "DEDUCTION" as PayrollItemType, deductionType: "CUSTOM" as DeductionType,        name: "Advance Recovery", amount: advanceDeductions, isPercentage: false, percentageOf: null }] : []),
        ...(absenceDeduction > 0  ? [{ itemType: "DEDUCTION" as PayrollItemType, deductionType: "ABSENCE" as DeductionType,       name: `Absent ${absentDays} days`, amount: absenceDeduction, isPercentage: false, percentageOf: null }] : []),
      ];

      const totalDeductionAmount = deductionItems.reduce((s, i) => s + i.amount, 0);
      const netSalary = grossSalary + overtimePay - totalDeductionAmount;

      await tx.payroll.create({
        data: {
          schoolId, staffId: staff.id, batchId: batch.id, payMonth, payYear, payPeriod,
          basicSalary, totalAllowances: totalAllowanceAmount, totalDeductions: totalDeductionAmount,
          grossSalary: grossSalary + overtimePay, taxableIncome: monthlyTaxable,
          nssfContribution: nssfEmployee, nssfEmployer, payeAmount,
          loanDeductions, advanceDeductions, netSalary,
          workingDays, daysWorked, absentDays, overtimeHours, overtimePay,
          status: "DRAFT",
          items: { create: [...allowanceItems, ...deductionItems] },
        },
      });

      totalGross      += grossSalary + overtimePay;
      totalNet        += netSalary;
      totalAllowances += totalAllowanceAmount;
      totalDeductions += totalDeductionAmount;
      totalNSSF       += nssfEmployee + nssfEmployer;
      totalPAYE       += payeAmount;
    }

    return tx.payrollBatch.update({
      where: { id: batch.id },
      data: {
        processedCount: allStaff.length,
        totalGrossSalary: totalGross, totalNetSalary: totalNet,
        totalAllowances, totalDeductions, totalNSSF, totalPAYE,
      },
    });
  });

  revalidatePath(`/staff/payroll`);
  return { ok: true, data: result, message: `Payroll batch created for ${payPeriod}` };
}

export async function getPayrollBatches(schoolId: string) {
  return db.payrollBatch.findMany({
    where: { schoolId },
    include: {
      preparedBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      _count: { select: { payrolls: true } },
    },
    orderBy: [{ payYear: "desc" }, { payMonth: "desc" }],
  });
}

export async function getPayrollBatchById(id: string) {
  return db.payrollBatch.findUnique({
    where: { id },
    include: {
      payrolls: {
        include: {
          staff: { select: { firstName: true, lastName: true, staffId: true } },
          items: true,
        },
      },
      preparedBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
  });
}

export async function submitBatchForApproval(id: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const batch = await db.payrollBatch.update({ where: { id, status: "DRAFT" }, data: { status: "REVIEW" } });
  revalidatePath(`/staff/payroll`);
  return { ok: true, data: batch, message: "Batch submitted for review" };
}

export async function approveBatch(id: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  const now = new Date();

  const batch = await db.payrollBatch.update({
    where: { id, status: "REVIEW" },
    data: { status: "APPROVED", approvedById: user.id, approvedAt: now },
  });

  await Promise.all([
    db.payroll.updateMany({
      where: { batchId: id },
      data: { status: "APPROVED", approvedById: user.id, approvedAt: now },
    }),
    db.overtimeRequest.updateMany({
      where: {
        schoolId: batch.schoolId,
        status: "APPROVED",
        date: {
          gte: new Date(batch.payYear, batch.payMonth - 1, 1),
          lte: new Date(batch.payYear, batch.payMonth, 0),
        },
      },
      data: { status: "PAID" },
    }),
  ]);

  revalidatePath(`/staff/payroll`);
  return { ok: true, data: batch, message: "Batch approved successfully" };
}

export async function markBatchAsPaid(
  id: string,
  data: { paymentRef: string; paymentMethod: ExpensePaymentMethod }
): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };

  const now = new Date();

  const batch = await db.payrollBatch.update({
    where: { id, status: "APPROVED" },
    data: { status: "PAID", paidAt: now, paymentRef: data.paymentRef },
  });

  await db.payroll.updateMany({
    where: { batchId: id },
    data: {
      status: "PAID",
      paidAt: now,
      paymentRef: data.paymentRef,
      paymentMethod: data.paymentMethod,
    },
  });

  revalidatePath(`/staff/payroll`);
  return { ok: true, data: batch, message: "Batch marked as paid" };
}

export async function getStaffPayrollHistory(staffId: string) {
  return db.payroll.findMany({
    where: { staffId },
    include: { items: true, payslips: true },
    orderBy: [{ payYear: "desc" }, { payMonth: "desc" }],
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SALARY ADVANCE & LOANS
// ════════════════════════════════════════════════════════════════════════════

export async function getSalaryAdvances(schoolId: string, filters?: { staffId?: string; status?: SalaryAdvanceStatus }) {
  return db.salaryAdvance.findMany({
    where: { schoolId, ...(filters?.staffId && { staffId: filters.staffId }), ...(filters?.status && { status: filters.status }) },
    include: { staff: { select: { firstName: true, lastName: true, staffId: true } }, approvedBy: { select: { name: true } }, repayments: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createSalaryAdvance(data: { staffId: string; schoolId: string; amountRequested: number; reason: string; recoveryStartMonth: number; recoveryStartYear: number; monthlyRecovery: number }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const advanceNumber = await generateAdvanceNumber(data.schoolId);
  const advance = await db.salaryAdvance.create({ data: { ...data, advanceNumber, status: "PENDING" } });
  revalidatePath(`/staff/advances`);
  return { ok: true, data: advance, message: "Salary advance requested" };
}

export async function approveAdvance(id: string, amountApproved: number): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };
  const advance = await db.salaryAdvance.update({ where: { id }, data: { status: "APPROVED", amountApproved, approvedById: user.id, approvedAt: new Date() } });
  revalidatePath(`/staff/advances`);
  return { ok: true, data: advance, message: "Advance approved" };
}

export async function disburseAdvance(id: string, disbursementRef: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const advance = await db.salaryAdvance.update({ where: { id, status: "APPROVED" }, data: { status: "DISBURSED", disbursedAt: new Date(), disbursementRef } });
  revalidatePath(`/staff/advances`);
  return { ok: true, data: advance, message: "Advance disbursed" };
}

export async function getStaffLoans(schoolId: string, filters?: { staffId?: string; status?: LoanStatus }) {
  return db.staffLoan.findMany({
    where: { schoolId, ...(filters?.staffId && { staffId: filters.staffId }), ...(filters?.status && { status: filters.status }) },
    include: { staff: { select: { firstName: true, lastName: true, staffId: true } }, approvedBy: { select: { name: true } }, repayments: { orderBy: { paidAt: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createStaffLoan(data: { staffId: string; schoolId: string; principalAmount: number; interestRate: number; tenureMonths: number; purpose: string; guarantorName?: string; guarantorPhone?: string }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const loanNumber = await generateLoanNumber(data.schoolId);
  const totalRepayable = data.principalAmount * (1 + (data.interestRate / 100) * (data.tenureMonths / 12));
  const monthlyInstalment = totalRepayable / data.tenureMonths;
  const loan = await db.staffLoan.create({ data: { ...data, loanNumber, totalRepayable, monthlyInstalment, outstandingBalance: totalRepayable, status: "PENDING" } });
  revalidatePath(`/staff/loans`);
  return { ok: true, data: loan, message: "Loan request submitted" };
}

export async function approveLoan(id: string, approvedAmount: number): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };
  const loan = await db.staffLoan.update({ where: { id }, data: { status: "APPROVED", approvedAmount, approvedById: user.id, approvedAt: new Date() } });
  revalidatePath(`/staff/loans`);
  return { ok: true, data: loan, message: "Loan approved" };
}

export async function disburseLoan(id: string, disbursementRef: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const loan = await db.staffLoan.findUniqueOrThrow({ where: { id } });
  const updated = await db.staffLoan.update({
    where: { id, status: "APPROVED" },
    data: { status: "ACTIVE", disbursedAt: new Date(), disbursementRef, expectedEndDate: new Date(new Date().setMonth(new Date().getMonth() + loan.tenureMonths)) },
  });
  revalidatePath(`/staff/loans`);
  return { ok: true, data: updated, message: "Loan disbursed" };
}

// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE APPRAISAL
// ════════════════════════════════════════════════════════════════════════════

export async function getAppraisalCycles(schoolId: string) {
  return db.appraisalCycle.findMany({ where: { schoolId }, include: { _count: { select: { appraisals: true } } }, orderBy: { year: "desc" } });
}

export async function createAppraisalCycle(data: { schoolId: string; name: string; year: number; term?: string; startDate: Date; endDate: Date; teachingWeight?: number; adminWeight?: number; punctualityWeight?: number; initiativeWeight?: number; teamworkWeight?: number }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const cycle = await db.appraisalCycle.create({ data });
  revalidatePath(`/staff/appraisals`);
  return { ok: true, data: cycle, message: "Appraisal cycle created" };
}

export async function getAppraisals(schoolId: string, cycleId?: string, filters?: { staffId?: string; status?: AppraisalStatus }) {
  return db.performanceAppraisal.findMany({
    where: { schoolId, ...(cycleId && { cycleId }), ...(filters?.staffId && { staffId: filters.staffId }), ...(filters?.status && { status: filters.status }) },
    include: { staff: { select: { firstName: true, lastName: true, staffId: true } }, reviewer: { select: { firstName: true, lastName: true } }, cycle: { select: { name: true, year: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function initiateSelfAppraisal(data: { staffId: string; schoolId: string; cycleId: string; reviewerId: string }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const appraisal = await db.performanceAppraisal.upsert({ where: { staffId_cycleId: { staffId: data.staffId, cycleId: data.cycleId } }, update: {}, create: { ...data, status: "SELF_REVIEW" } });
  revalidatePath(`/staff/appraisals`);
  return { ok: true, data: appraisal, message: "Self appraisal initiated" };
}

export async function submitSelfAppraisal(id: string, data: { selfScore: number; selfComments: string }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const appraisal = await db.performanceAppraisal.update({ where: { id }, data: { ...data, selfSubmittedAt: new Date(), status: "MANAGER_REVIEW" } });
  revalidatePath(`/staff/appraisals`);
  return { ok: true, data: appraisal, message: "Self appraisal submitted" };
}

export async function submitManagerReview(id: string, data: { teachingScore?: number; adminScore?: number; punctualityScore?: number; initiativeScore?: number; teamworkScore?: number; overallScore: number; finalRating: AppraisalRating; reviewerComments: string; strengthsNoted?: string; areasForImprovement?: string; developmentPlan?: string }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const appraisal = await db.performanceAppraisal.update({ where: { id }, data: { ...data, reviewerSubmittedAt: new Date(), status: "MODERATION" } });
  revalidatePath(`/staff/appraisals`);
  return { ok: true, data: appraisal, message: "Manager review submitted" };
}

export async function completeAppraisal(id: string, moderatedScore?: number, notes?: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const appraisal = await db.performanceAppraisal.update({ where: { id }, data: { status: "COMPLETED", moderatedScore, moderationNotes: notes, moderatedAt: new Date() } });
  revalidatePath(`/staff/appraisals`);
  return { ok: true, data: appraisal, message: "Appraisal completed" };
}

export async function acknowledgeAppraisal(id: string, responseNotes?: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const appraisal = await db.performanceAppraisal.update({ where: { id }, data: { staffAcknowledged: true, staffAcknowledgedAt: new Date(), staffResponseNotes: responseNotes } });
  revalidatePath(`/staff/appraisals`);
  return { ok: true, data: appraisal, message: "Appraisal acknowledged" };
}

// ════════════════════════════════════════════════════════════════════════════
// DISCIPLINARY & GRIEVANCE
// ════════════════════════════════════════════════════════════════════════════

export async function getDisciplinaryRecords(schoolId: string, filters?: { staffId?: string; status?: DisciplinaryStatus }) {
  return db.disciplinaryRecord.findMany({
    where: { schoolId, ...(filters?.staffId && { staffId: filters.staffId }), ...(filters?.status && { status: filters.status }) },
    include: { staff: { select: { firstName: true, lastName: true, staffId: true } }, issuedBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createDisciplinaryRecord(data: { staffId: string; schoolId: string; issuedById: string; disciplinaryType: DisciplinaryType; incidentDate: Date; incidentDescription: string; witnessNames?: string[] }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const caseNumber = await generateDisciplinaryCase(data.schoolId);
  const record = await db.disciplinaryRecord.create({ data: { ...data, caseNumber, status: "OPEN", witnessNames: data.witnessNames ?? [] } });
  revalidatePath(`/staff/disciplinary`);
  return { ok: true, data: record, message: "Disciplinary record created" };
}

export async function updateDisciplinaryRecord(id: string, data: { status?: DisciplinaryStatus; investigationNotes?: string; hearingDate?: Date; hearingNotes?: string; outcome?: string; sanctionDetails?: string; sanctionStartDate?: Date; sanctionEndDate?: Date; suspensionWithPay?: boolean; isAppealed?: boolean; appealDate?: Date; appealOutcome?: string; documentUrls?: string[] }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };
  const record = await db.disciplinaryRecord.update({ where: { id }, data: { ...data, ...(data.status === "CLOSED" && { closedAt: new Date(), closedById: user.id }) } });
  revalidatePath(`/staff/disciplinary`);
  return { ok: true, data: record, message: "Record updated" };
}

export async function getGrievanceRecords(schoolId: string, filters?: { status?: GrievanceStatus }) {
  return db.grievanceRecord.findMany({
    where: { schoolId, ...(filters?.status && { status: filters.status }) },
    include: { staff: { select: { firstName: true, lastName: true, staffId: true } }, handledBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createGrievance(data: { staffId: string; schoolId: string; subject: string; description: string; isAnonymous?: boolean; documentUrls?: string[] }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const caseNumber = await generateGrievanceCase(data.schoolId);
  const record = await db.grievanceRecord.create({ data: { ...data, caseNumber, status: "SUBMITTED", documentUrls: data.documentUrls ?? [] } });
  revalidatePath(`/staff/grievances`);
  return { ok: true, data: record, message: "Grievance submitted" };
}

export async function updateGrievance(id: string, data: { status?: GrievanceStatus; handledById?: string; investigationNotes?: string; mediationNotes?: string; resolutionDetails?: string; resolvedAt?: Date; escalatedAt?: Date; escalatedTo?: string; escalationNotes?: string; closedAt?: Date }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const record = await db.grievanceRecord.update({ where: { id }, data });
  revalidatePath(`/staff/grievances`);
  return { ok: true, data: record, message: "Grievance updated" };
}

// ════════════════════════════════════════════════════════════════════════════
// STAFF DOCUMENTS
// ════════════════════════════════════════════════════════════════════════════

export async function getStaffDocuments(staffId: string, category?: DocumentCategory) {
  return db.staffDocument.findMany({
    where: { staffId, ...(category && { category }) },
    include: { verifiedBy: { select: { name: true } }, uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function uploadStaffDocument(data: { staffId: string; schoolId: string; category: DocumentCategory; name: string; description?: string; fileUrl: string; fileType?: string; fileSizeKb?: number; issueDate?: Date; expiryDate?: Date; isConfidential?: boolean }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };
  const doc = await db.staffDocument.create({ data: { ...data, uploadedById: user.id } });
  revalidatePath(`/staff/${data.staffId}/documents`);
  return { ok: true, data: doc, message: "Document uploaded" };
}

export async function verifyStaffDocument(id: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };
  const doc = await db.staffDocument.update({ where: { id }, data: { isVerified: true, verifiedById: user.id, verifiedAt: new Date() } });
  return { ok: true, data: doc, message: "Document verified" };
}

export async function getExpiringDocuments(schoolId: string, withinDays = 30) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + withinDays);
  return db.staffDocument.findMany({
    where: { schoolId, expiryDate: { lte: threshold, gte: new Date() } },
    include: { staff: { select: { firstName: true, lastName: true, staffId: true } } },
    orderBy: { expiryDate: "asc" },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// TRAINING
// ════════════════════════════════════════════════════════════════════════════

export async function getTrainingPrograms(schoolId: string, status?: TrainingStatus) {
  return db.trainingProgram.findMany({ where: { schoolId, ...(status && { status }) }, include: { _count: { select: { participants: true } }, createdBy: { select: { name: true } } }, orderBy: { startDate: "desc" } });
}

export async function createTrainingProgram(data: { schoolId: string; title: string; description?: string; trainingType: TrainingType; provider?: string; venue?: string; isOnline?: boolean; onlineLink?: string; startDate: Date; endDate: Date; totalHours?: number; maxParticipants?: number; cost?: number; costPerStaff?: number; targetRoles?: string[]; skills?: string[] }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };
  const program = await db.trainingProgram.create({ data: { ...data, status: "PLANNED", targetRoles: data.targetRoles ?? [], skills: data.skills ?? [], createdById: user.id } });
  revalidatePath(`/staff/training`);
  return { ok: true, data: program, message: "Training program created" };
}

export async function enrollStaffInTraining(trainingId: string, staffIds: string[], schoolId: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const created = await db.$transaction(staffIds.map((staffId) => db.trainingParticipant.upsert({ where: { trainingId_staffId: { trainingId, staffId } }, update: { status: "PLANNED" }, create: { trainingId, staffId, schoolId, status: "PLANNED" } })));
  revalidatePath(`/staff/training`);
  return { ok: true, data: { enrolled: created.length }, message: `${created.length} staff enrolled` };
}

export async function updateTrainingParticipant(trainingId: string, staffId: string, data: { status?: TrainingStatus; attendedHours?: number; completedAt?: Date; score?: number; passed?: boolean; certificateUrl?: string; feedback?: string }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const participant = await db.trainingParticipant.update({ where: { trainingId_staffId: { trainingId, staffId } }, data: { ...data, ...(data.certificateUrl && { certificateIssuedAt: new Date() }) } });
  revalidatePath(`/staff/training`);
  return { ok: true, data: participant, message: "Participant updated" };
}

export async function updateTrainingStatus(id: string, status: TrainingStatus): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const program = await db.trainingProgram.update({ where: { id }, data: { status } });
  revalidatePath(`/staff/training`);
  return { ok: true, data: program, message: "Training status updated" };
}

// ════════════════════════════════════════════════════════════════════════════
// NOTICE BOARD
// ════════════════════════════════════════════════════════════════════════════

export async function getStaffNotices(schoolId: string, filters?: { status?: NoticeStatus; audience?: NoticeAudience }) {
  return db.staffNotice.findMany({ where: { schoolId, ...(filters?.status && { status: filters.status }), ...(filters?.audience && { audience: filters.audience }) }, include: { createdBy: { select: { firstName: true, lastName: true } }, _count: { select: { acknowledgements: true } } }, orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }] });
}

export async function createStaffNotice(data: { schoolId: string; createdById: string; title: string; content: string; audience: NoticeAudience; isPinned?: boolean; priority?: string; targetRoleIds?: string[]; targetStaffIds?: string[]; publishedAt?: Date; expiresAt?: Date; attachmentUrls?: string[]; requiresAcknowledgement?: boolean }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const status: NoticeStatus = data.publishedAt ? "PUBLISHED" : "DRAFT";
  const notice = await db.staffNotice.create({ data: { ...data, status, targetRoleIds: data.targetRoleIds ?? [], targetStaffIds: data.targetStaffIds ?? [], attachmentUrls: data.attachmentUrls ?? [] } });
  revalidatePath(`/staff/notices`);
  return { ok: true, data: notice, message: "Notice created" };
}

export async function publishNotice(id: string): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const notice = await db.staffNotice.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
  revalidatePath(`/staff/notices`);
  return { ok: true, data: notice, message: "Notice published" };
}

export async function acknowledgeNotice(noticeId: string, staffId: string, schoolId: string): Promise<ActionResponse> {
  const ack = await db.noticeAcknowledgement.upsert({ where: { noticeId_staffId: { noticeId, staffId } }, update: {}, create: { noticeId, staffId, schoolId } });
  return { ok: true, data: ack, message: "Notice acknowledged" };
}

// ════════════════════════════════════════════════════════════════════════════
// EXIT / OFFBOARDING
// ════════════════════════════════════════════════════════════════════════════

export async function getExitRecords(schoolId: string, filters?: { status?: ExitStatus }) {
  return db.exitRecord.findMany({
    where: { schoolId, ...(filters?.status && { status: filters.status }) },
    include: {
      staff: { select: { firstName: true, lastName: true, staffId: true } },
      interviewConductedBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function initiateOffboarding(data: { staffId: string; schoolId: string; exitType: ExitType; exitDate: Date; noticeDate?: Date; lastWorkingDay?: Date }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, message: "Unauthorized" };
  const existing = await db.exitRecord.findUnique({ where: { staffId: data.staffId } });
  if (existing) return { ok: false, message: "An offboarding record already exists for this staff member." };
  const exitRecord = await db.$transaction(async (tx) => {
    const record = await tx.exitRecord.create({ data: { ...data, status: "INITIATED" } });
    await tx.staff.update({ where: { id: data.staffId }, data: { status: "RESIGNED" } });
    return record;
  });
  revalidatePath(`/staff/offboarding`);
  return { ok: true, data: exitRecord, message: "Offboarding initiated" };
}

export async function completeOffboarding(staffId: string, data: { finalSalaryPaid?: boolean; gratuityAmount?: number; gratuityPaid?: boolean; noticePeriodPaid?: boolean; otherSettlementNotes?: string; experienceLetterIssued?: boolean; experienceLetterUrl?: string; releasingLetterIssued?: boolean; releasingLetterUrl?: string; recommendationIssued?: boolean }): Promise<ActionResponse> {
  const user = await getAuthenticatedUser();
  if (!user?.id) return { ok: false, message: "Unauthorized" };
  const record = await db.exitRecord.update({ where: { staffId }, data: { ...data, status: "COMPLETED", approvedById: user.id, approvedAt: new Date(), completedAt: new Date() } });
  revalidatePath(`/staff/offboarding`);
  return { ok: true, data: record, message: "Offboarding completed" };
}

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ════════════════════════════════════════════════════════════════════════════

export async function getStaffDashboardStats(schoolId: string) {
  const [
    totalStaff, activeStaff, onLeave, teachingStaff,
    pendingLeave, pendingPayroll, pendingDisc, expiringDocs, pendingLoans,
  ] = await Promise.all([
    db.staff.count({ where: { schoolId } }),
    db.staff.count({ where: { schoolId, status: "ACTIVE" } }),
    db.staff.count({ where: { schoolId, status: "ON_LEAVE" } }),
    db.staff.count({ where: { schoolId, staffType: "TEACHING", status: "ACTIVE" } }),
    db.leaveRequest.count({ where: { schoolId, status: "PENDING" } }),
    db.payrollBatch.count({ where: { schoolId, status: { in: ["DRAFT", "REVIEW"] } } }),
    db.disciplinaryRecord.count({ where: { schoolId, status: { in: ["OPEN", "UNDER_INVESTIGATION"] } } }),
    db.staffDocument.count({ where: { schoolId, expiryDate: { lte: new Date(Date.now() + 30 * 86400000), gte: new Date() } } }),
    db.staffLoan.count({ where: { schoolId, status: "PENDING" } }),
  ]);

  return {
    totalStaff, activeStaff, onLeave,
    teachingStaff, nonTeachingStaff: activeStaff - teachingStaff,
    pendingLeaveRequests:  pendingLeave,
    pendingPayrollBatch:   pendingPayroll,
    pendingDisciplinary:   pendingDisc,
    expiringDocuments:     expiringDocs,
    pendingLoans,
  };
}

export async function getPayrollSummary(schoolId: string, payYear: number) {
  const batches = await db.payrollBatch.findMany({ where: { schoolId, payYear }, orderBy: { payMonth: "asc" } });
  return {
    year: payYear,
    months: batches.map((b) => ({
      month: b.payMonth, period: b.payPeriod, status: b.status,
      totalStaff: b.totalStaffCount, totalGross: b.totalGrossSalary,
      totalNet: b.totalNetSalary, totalNSSF: b.totalNSSF, totalPAYE: b.totalPAYE,
    })),
    yearlyTotals: {
      totalGross: batches.reduce((s, b) => s + b.totalGrossSalary, 0),
      totalNet:   batches.reduce((s, b) => s + b.totalNetSalary, 0),
      totalNSSF:  batches.reduce((s, b) => s + b.totalNSSF, 0),
      totalPAYE:  batches.reduce((s, b) => s + b.totalPAYE, 0),
    },
  };
}