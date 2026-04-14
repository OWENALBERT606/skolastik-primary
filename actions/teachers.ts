


// "use server";

// import { db } from "@/prisma/db";
// import bcrypt from "bcryptjs";
// import { Prisma, TeacherStatus, TeacherYearStatus, AssignmentStatus, StaffStatus } from "@prisma/client";
// import { revalidatePath } from "next/cache";

// /** ============================
//  * UTILITY FUNCTIONS
//  * ============================*/

// function generateStaffNo(): string {
//   const initials = "TCH";
//   const randomPart = Math.floor(10000 + Math.random() * 90000);
//   return `${initials}${randomPart}`;
// }

// function toDateOrNull(d?: string | null): Date | null {
//   if (!d) return null;
//   const [y, m, day] = d.split("-").map(Number);
//   if (!y || !m || !day || isNaN(y) || isNaN(m) || isNaN(day)) return null;
//   if (m < 1 || m > 12 || day < 1 || day > 31) return null;
//   return new Date(Date.UTC(y, m - 1, day, 12, 0, 0));
// }

// function validateTeacherStatus(status?: string | null): TeacherStatus {
//   if (!status) return TeacherStatus.ACTIVE;
//   const validStatuses = Object.values(TeacherStatus);
//   if (validStatuses.includes(status as TeacherStatus)) return status as TeacherStatus;
//   return TeacherStatus.ACTIVE;
// }

// /**
//  * Maps TeacherStatus → StaffStatus for reverse sync
//  */
// function toStaffStatus(teacherStatus: TeacherStatus): StaffStatus {
//   const map: Record<TeacherStatus, StaffStatus> = {
//     [TeacherStatus.ACTIVE]:     StaffStatus.ACTIVE,
//     [TeacherStatus.ON_LEAVE]:   StaffStatus.ON_LEAVE,
//     [TeacherStatus.SUSPENDED]:  StaffStatus.SUSPENDED,
//     [TeacherStatus.RESIGNED]:   StaffStatus.RESIGNED,
//     [TeacherStatus.TERMINATED]: StaffStatus.TERMINATED,
//     [TeacherStatus.RETIRED]:    StaffStatus.RETIRED,
//   };
//   return map[teacherStatus] ?? StaffStatus.ACTIVE;
// }

// async function logTeacherAction(
//   action: string,
//   teacherId: string,
//   previousValue: any,
//   newValue: any,
//   performedById: string,
//   ipAddress?: string,
//   userAgent?: string
// ) {
//   try {
//     await db.markAuditLog.create({
//       data: {
//         entityType: "Teacher",
//         entityId: teacherId,
//         action,
//         previousValue: previousValue || Prisma.JsonNull,
//         newValue: newValue || Prisma.JsonNull,
//         performedById,
//         performedAt: new Date(),
//         ipAddress,
//         userAgent,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Failed to create audit log:", error);
//   }
// }

// /** ============================
//  * TYPES
//  * ============================*/

// type CreateTeacherPayload = {
//   email: string;
//   phone: string;
//   firstName: string;
//   lastName: string;
//   password: string;
//   schoolId: string;
//   gender: string;
//   dateOfBirth: string;
//   employmentType: string;
//   role: string;
//   nationality?: string | null;
//   nationalId?: string | null;
//   maritalStatus?: string | null;
//   address?: string | null;
//   emergencyContactName?: string | null;
//   emergencyRelationship?: string | null;
//   emergencyPhone?: string | null;
//   emergencyEmail?: string | null;
//   qualification?: string | null;
//   specialization?: string | null;
//   teachingLevel?: string | null;
//   experienceYears?: number | null;
//   previousSchools?: string[];
//   dateOfHire?: string | null;
//   highestQualification?: string | null;
//   institutionAttended?: string | null;
//   professionalTraining?: string | null;
//   ongoingStudies?: string | null;
//   profilePhoto?: string | null;
//   documents?: string | null;
//   healthInfo?: string | null;
//   currentStatus?: TeacherStatus;
//   performedById?: string;
//   ipAddress?: string;
//   userAgent?: string;
// };

// type UpdateTeacherPayload = Partial<Omit<CreateTeacherPayload, "password" | "schoolId">>;

// type ActionResponse<T = any> = {
//   ok: boolean;
//   message: string;
//   data?: T;
// };

// /** ============================
//  * 1. CREATE TEACHER WITH USER
//  * ============================*/

// export async function createTeacherWithUser(
//   data: CreateTeacherPayload
// ): Promise<ActionResponse> {
//   try {
//     const {
//       email, phone, firstName, lastName, password, schoolId, gender,
//       dateOfBirth, employmentType, role, nationality, nationalId, maritalStatus,
//       address, emergencyContactName, emergencyRelationship, emergencyPhone,
//       emergencyEmail, qualification, specialization, teachingLevel, experienceYears,
//       previousSchools, dateOfHire, highestQualification, institutionAttended,
//       professionalTraining, ongoingStudies, profilePhoto, documents, healthInfo,
//       currentStatus, performedById, ipAddress, userAgent,
//     } = data;

//     if (!email || !phone || !firstName || !lastName || !password) {
//       return { ok: false, message: "Required fields are missing" };
//     }
//     if (!schoolId) return { ok: false, message: "School ID is required" };

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) return { ok: false, message: "Invalid email format" };
//     if (phone.length < 10) return { ok: false, message: "Phone number must be at least 10 digits" };

//     const parsedDOB = toDateOrNull(dateOfBirth);
//     if (!parsedDOB) return { ok: false, message: "Invalid date of birth format. Use YYYY-MM-DD" };
//     if (parsedDOB > new Date()) return { ok: false, message: "Date of birth cannot be in the future" };

//     const parsedHireDate = dateOfHire ? toDateOrNull(dateOfHire) : new Date();
//     if (dateOfHire && !parsedHireDate) return { ok: false, message: "Invalid hire date format. Use YYYY-MM-DD" };

//     const existingUser = await db.user.findFirst({ where: { OR: [{ email }, { phone }] } });
//     if (existingUser) return { ok: false, message: "User with this email or phone already exists." };

//     const [byPhone, byEmail, byNatId] = await Promise.all([
//       db.teacher.findUnique({ where: { phone } }),
//       db.teacher.findUnique({ where: { email } }),
//       nationalId ? db.teacher.findUnique({ where: { nationalId } }) : Promise.resolve(null),
//     ]);

//     if (byPhone) return { ok: false, message: "Teacher phone already exists." };
//     if (byEmail) return { ok: false, message: "Teacher email already exists." };
//     if (byNatId) return { ok: false, message: "Teacher National ID already exists." };

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const name = `${firstName} ${lastName}`.trim();
//     const staffNo = generateStaffNo();
//     const validatedStatus = validateTeacherStatus(currentStatus);

//     const teacher = await db.$transaction(async (tx) => {
//       const teacherRole = await tx.role.upsert({
//         where: { roleName: "teacher" },
//         create: {
//           roleName: "teacher",
//           displayName: "Teacher",
//           permissions: ["view_classes", "manage_marks", "view_students"],
//         },
//         update: {},
//       });

//       const user = await tx.user.create({
//         data: {
//           email, phone, firstName, lastName, name,
//           password: hashedPassword,
//           status: true,
//           isVerfied: false,
//           roles: { connect: [{ id: teacherRole.id }] },
//         },
//       });

//       const newTeacher = await tx.teacher.create({
//         data: {
//           userId: user.id, schoolId, staffNo, firstName, lastName, gender,
//           dateOfBirth: parsedDOB,
//           nationality: nationality || null,
//           nationalId: nationalId || null,
//           maritalStatus: maritalStatus || null,
//           phone, email,
//           address: address || null,
//           emergencyContactName: emergencyContactName || null,
//           emergencyRelationship: emergencyRelationship || null,
//           emergencyPhone: emergencyPhone || null,
//           emergencyEmail: emergencyEmail || null,
//           qualification: qualification || null,
//           specialization: specialization || null,
//           teachingLevel: teachingLevel || null,
//           experienceYears: experienceYears || null,
//           previousSchools: previousSchools || [],
//           dateOfHire: parsedHireDate || new Date(),
//           employmentType, role,
//           currentStatus: validatedStatus,
//           status: validatedStatus,
//           highestQualification: highestQualification || null,
//           institutionAttended: institutionAttended || null,
//           professionalTraining: professionalTraining || null,
//           ongoingStudies: ongoingStudies || null,
//           profilePhoto: profilePhoto || null,
//           documents: documents || null,
//           healthInfo: healthInfo || null,
//         },
//         include: {
//           user: { select: { id: true, email: true, name: true } },
//         },
//       });

//       return newTeacher;
//     });

//     if (performedById) {
//       await logTeacherAction("CREATE", teacher.id, null, { teacher, user: teacher.user }, performedById, ipAddress, userAgent);
//     }

//     revalidatePath("/dashboard/teachers");
//     return {
//       ok: true,
//       data: teacher,
//       message: `Teacher ${teacher.firstName} ${teacher.lastName} registered successfully with Staff No: ${staffNo}`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error registering teacher:", error);
//     if (error.code === "P2002") return { ok: false, message: "A teacher with this information already exists (duplicate constraint)" };
//     return { ok: false, message: error?.message ?? "Failed to register teacher" };
//   }
// }

// /** ============================
//  * 2. UPDATE TEACHER
//  * ✅ NOW SYNCS TO STAFF RECORD
//  * ============================*/

// export async function updateTeacher(
//   id: string,
//   data: UpdateTeacherPayload
// ): Promise<ActionResponse> {
//   try {
//     const {
//       email, phone, firstName, lastName, gender, dateOfBirth, nationality,
//       nationalId, maritalStatus, address, emergencyContactName, emergencyRelationship,
//       emergencyPhone, emergencyEmail, qualification, specialization, teachingLevel,
//       experienceYears, previousSchools, dateOfHire, employmentType, role,
//       highestQualification, institutionAttended, professionalTraining, ongoingStudies,
//       profilePhoto, documents, healthInfo, currentStatus, performedById, ipAddress, userAgent,
//     } = data;

//     // Load teacher + staffId for reverse sync
//     const existingTeacher = await db.teacher.findUnique({
//       where: { id },
//       include: {
//         user: true,
//         // Load linked Staff record id (staffId is the FK on Teacher)
//         staff: { select: { id: true, userId: true, basicSalary: true } },
//       },
//     });

//     if (!existingTeacher) return { ok: false, message: "Teacher not found" };

//     // Date validation
//     let parsedDOB: Date | null | undefined = undefined;
//     if (dateOfBirth !== undefined) {
//       parsedDOB = toDateOrNull(dateOfBirth);
//       if (dateOfBirth && !parsedDOB) return { ok: false, message: "Invalid date of birth format. Use YYYY-MM-DD" };
//       if (parsedDOB && parsedDOB > new Date()) return { ok: false, message: "Date of birth cannot be in the future" };
//     }

//     let parsedHireDate: Date | null | undefined = undefined;
//     if (dateOfHire !== undefined) {
//       parsedHireDate = toDateOrNull(dateOfHire);
//       if (dateOfHire && !parsedHireDate) return { ok: false, message: "Invalid hire date format. Use YYYY-MM-DD" };
//     }

//     // Uniqueness checks
//     if (email && email !== existingTeacher.email) {
//       const emailExists = await db.teacher.findUnique({ where: { email } });
//       if (emailExists) return { ok: false, message: "Email already in use by another teacher" };
//     }
//     if (phone && phone !== existingTeacher.phone) {
//       const phoneExists = await db.teacher.findUnique({ where: { phone } });
//       if (phoneExists) return { ok: false, message: "Phone already in use by another teacher" };
//     }
//     if (nationalId && nationalId !== existingTeacher.nationalId) {
//       const idExists = await db.teacher.findUnique({ where: { nationalId } });
//       if (idExists) return { ok: false, message: "National ID already in use by another teacher" };
//     }

//     const updatedTeacher = await db.$transaction(async (tx) => {
//       // ── 1. Update User ─────────────────────────────────────────────────
//       const userUpdateData: Prisma.UserUpdateInput = {};
//       if (email !== undefined) userUpdateData.email = email;
//       if (phone !== undefined) userUpdateData.phone = phone;
//       if (firstName !== undefined) userUpdateData.firstName = firstName;
//       if (lastName !== undefined) userUpdateData.lastName = lastName;
//       if (firstName !== undefined && lastName !== undefined) {
//         userUpdateData.name = `${firstName} ${lastName}`;
//       } else if (firstName !== undefined) {
//         userUpdateData.name = `${firstName} ${existingTeacher.lastName}`;
//       } else if (lastName !== undefined) {
//         userUpdateData.name = `${existingTeacher.firstName} ${lastName}`;
//       }

//       if (Object.keys(userUpdateData).length > 0) {
//         await tx.user.update({ where: { id: existingTeacher.userId }, data: userUpdateData });
//       }

//       // ── 2. Update Teacher ──────────────────────────────────────────────
//       const teacherUpdateData: Prisma.TeacherUpdateInput = {};

//       if (firstName !== undefined)            teacherUpdateData.firstName           = firstName;
//       if (lastName !== undefined)             teacherUpdateData.lastName            = lastName;
//       if (gender !== undefined)               teacherUpdateData.gender              = gender;
//       if (parsedDOB !== undefined)            teacherUpdateData.dateOfBirth         = parsedDOB === null ? undefined : parsedDOB;
//       if (nationality !== undefined)          teacherUpdateData.nationality         = nationality;
//       if (nationalId !== undefined)           teacherUpdateData.nationalId          = nationalId;
//       if (maritalStatus !== undefined)        teacherUpdateData.maritalStatus       = maritalStatus;
//       if (phone !== undefined)                teacherUpdateData.phone               = phone;
//       if (email !== undefined)                teacherUpdateData.email               = email;
//       if (address !== undefined)              teacherUpdateData.address             = address;
//       if (emergencyContactName !== undefined) teacherUpdateData.emergencyContactName = emergencyContactName;
//       if (emergencyRelationship !== undefined) teacherUpdateData.emergencyRelationship = emergencyRelationship;
//       if (emergencyPhone !== undefined)       teacherUpdateData.emergencyPhone      = emergencyPhone;
//       if (emergencyEmail !== undefined)       teacherUpdateData.emergencyEmail      = emergencyEmail;
//       if (qualification !== undefined)        teacherUpdateData.qualification       = qualification;
//       if (specialization !== undefined)       teacherUpdateData.specialization      = specialization;
//       if (teachingLevel !== undefined)        teacherUpdateData.teachingLevel       = teachingLevel;
//       if (experienceYears !== undefined)      teacherUpdateData.experienceYears     = experienceYears;
//       if (previousSchools !== undefined)      teacherUpdateData.previousSchools     = previousSchools;
//       if (parsedHireDate !== undefined)       teacherUpdateData.dateOfHire          = parsedHireDate === null ? undefined : parsedHireDate;
//       if (employmentType !== undefined)       teacherUpdateData.employmentType      = employmentType;
//       if (role !== undefined)                 teacherUpdateData.role                = role;
//       if (highestQualification !== undefined) teacherUpdateData.highestQualification = highestQualification;
//       if (institutionAttended !== undefined)  teacherUpdateData.institutionAttended = institutionAttended;
//       if (professionalTraining !== undefined) teacherUpdateData.professionalTraining = professionalTraining;
//       if (ongoingStudies !== undefined)       teacherUpdateData.ongoingStudies      = ongoingStudies;
//       if (profilePhoto !== undefined)         teacherUpdateData.profilePhoto        = profilePhoto;
//       if (documents !== undefined)            teacherUpdateData.documents           = documents;
//       if (healthInfo !== undefined)           teacherUpdateData.healthInfo          = healthInfo;

//       if (currentStatus !== undefined) {
//         const validatedStatus = validateTeacherStatus(currentStatus);
//         teacherUpdateData.currentStatus = validatedStatus;
//         teacherUpdateData.status        = validatedStatus;
//       }

//       const teacher = await tx.teacher.update({
//         where: { id },
//         data: teacherUpdateData,
//         include: {
//           user: { select: { id: true, email: true, name: true } },
//         },
//       });

//       // ── 3. Sync Staff record (reverse sync) ───────────────────────────
//       // Only runs if this Teacher was created via the HR Staff module
//       if (existingTeacher.staffId && existingTeacher.staff) {
//         const staffUpdate: Prisma.StaffUpdateInput = {};

//         // Profile fields — map Teacher field names → Staff field names
//         if (firstName !== undefined)               staffUpdate.firstName             = firstName;
//         if (lastName !== undefined)                staffUpdate.lastName              = lastName;
//         if (gender !== undefined)                  staffUpdate.gender                = gender;
//         if (parsedDOB !== undefined && parsedDOB !== null)
//                                                    staffUpdate.dob                   = parsedDOB;
//         if (nationality !== undefined)             staffUpdate.nationality           = nationality;
//         if (nationalId !== undefined)              staffUpdate.nationalId            = nationalId;
//         if (phone !== undefined)                   staffUpdate.phone                 = phone;
//         if (email !== undefined)                   staffUpdate.email                 = email;
//         if (address !== undefined)                 staffUpdate.address               = address;
//         if (profilePhoto !== undefined)            staffUpdate.imageUrl              = profilePhoto;  // ← different field name
//         if (highestQualification !== undefined)    staffUpdate.highestQualification  = highestQualification;
//         if (specialization !== undefined)          staffUpdate.specialization        = specialization;
//         if (emergencyContactName !== undefined)    staffUpdate.emergencyName         = emergencyContactName; // ← different field name
//         if (emergencyPhone !== undefined)          staffUpdate.emergencyPhone        = emergencyPhone;
//         if (emergencyRelationship !== undefined)   staffUpdate.emergencyRelationship = emergencyRelationship;

//         // Status sync
//         if (currentStatus !== undefined) {
//           const validatedStatus = validateTeacherStatus(currentStatus);
//           const mappedStaffStatus = toStaffStatus(validatedStatus);
//           staffUpdate.status = mappedStaffStatus;

//           // Record exit info on Staff if teacher is leaving
//           if (["RESIGNED", "TERMINATED", "RETIRED"].includes(mappedStaffStatus)) {
//             staffUpdate.exitDate   = new Date();
//             staffUpdate.exitReason = `${mappedStaffStatus} — updated via Teachers module`;
//           }
//         }

//         if (Object.keys(staffUpdate).length > 0) {
//           await tx.staff.update({
//             where: { id: existingTeacher.staffId },
//             data: staffUpdate,
//           });
//         }
//       }

//       return teacher;
//     });

//     if (performedById) {
//       await logTeacherAction("UPDATE", id, existingTeacher, updatedTeacher, performedById, ipAddress, userAgent);
//     }

//     revalidatePath("/dashboard/teachers");
//     return {
//       ok: true,
//       data: updatedTeacher,
//       message: `Teacher ${updatedTeacher.firstName} ${updatedTeacher.lastName} updated successfully`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error updating teacher:", error);
//     if (error.code === "P2002") return { ok: false, message: "Update failed due to duplicate constraint (email, phone, or national ID)" };
//     return { ok: false, message: error?.message ?? "Failed to update teacher" };
//   }
// }

// /** ============================
//  * 3. DELETE TEACHER
//  * ============================*/

// export async function deleteTeacher(
//   id: string,
//   performedById?: string,
//   ipAddress?: string,
//   userAgent?: string
// ): Promise<ActionResponse> {
//   try {
//     const teacher = await db.teacher.findUnique({
//       where: { id },
//       include: { user: true },
//     });

//     if (!teacher) return { ok: false, message: "Teacher not found" };

//     const [
//       activeAssignments, paperAssignments, headedStreams, headedSubjects,
//       aoiUnitsCount, aoiScoresCount, examMarksCount,
//     ] = await Promise.all([
//       db.streamSubjectTeacher.count({ where: { teacherId: id, status: AssignmentStatus.ACTIVE } }),
//       db.streamSubjectPaperTeacher.count({ where: { teacherId: id, status: AssignmentStatus.ACTIVE } }),
//       db.stream.count({ where: { classHeadId: id } }),
//       db.subject.count({ where: { headTeacherId: id } }),
//       db.aOIUnit.count({ where: { enteredById: id } }),
//       db.aOIScore.count({ where: { enteredById: id } }),
//       db.examMark.count({ where: { enteredById: id } }),
//     ]);

//     const issues: string[] = [];
//     if (activeAssignments > 0) issues.push(`${activeAssignments} active subject assignment(s)`);
//     if (paperAssignments > 0)  issues.push(`${paperAssignments} active paper assignment(s)`);
//     if (headedStreams > 0)     issues.push(`head of ${headedStreams} stream(s)`);
//     if (headedSubjects > 0)    issues.push(`head of ${headedSubjects} subject(s)`);
//     if (aoiUnitsCount > 0)     issues.push(`${aoiUnitsCount} AOI unit(s) entered`);
//     if (aoiScoresCount > 0)    issues.push(`${aoiScoresCount} AOI score(s) entered`);
//     if (examMarksCount > 0)    issues.push(`${examMarksCount} exam mark(s) entered`);

//     if (issues.length > 0) {
//       return {
//         ok: false,
//         message: `Cannot delete teacher. Blockers: ${issues.join(", ")}. Please resolve these first.`,
//       };
//     }

//     const teacherInfo = {
//       id: teacher.id,
//       name: `${teacher.firstName} ${teacher.lastName}`,
//       staffNo: teacher.staffNo,
//       email: teacher.email,
//     };

//     await db.teacher.delete({ where: { id } });

//     if (performedById) {
//       await logTeacherAction("DELETE", id, teacherInfo, null, performedById, ipAddress, userAgent);
//     }

//     revalidatePath("/dashboard/teachers");
//     return { ok: true, message: `Teacher ${teacher.firstName} ${teacher.lastName} deleted successfully` };
//   } catch (error: any) {
//     console.error("❌ Error deleting teacher:", error);
//     return { ok: false, message: error?.message ?? "Failed to delete teacher" };
//   }
// }

// /** ============================
//  * 4. TOGGLE TEACHER STATUS
//  * ============================*/

// export async function toggleTeacherStatus(
//   teacherId: string,
//   currentStatus: boolean,
//   performedById?: string,
//   ipAddress?: string,
//   userAgent?: string
// ): Promise<ActionResponse> {
//   try {
//     const teacher = await db.teacher.findUnique({
//       where: { id: teacherId },
//       include: { user: true },
//     });

//     if (!teacher) return { ok: false, message: "Teacher not found" };

//     const previousStatus = teacher.user.status;
//     const newStatus = !currentStatus;

//     await db.user.update({
//       where: { id: teacher.userId },
//       data: { status: newStatus },
//     });

//     if (performedById) {
//       await logTeacherAction("TOGGLE_STATUS", teacherId, { userStatus: previousStatus }, { userStatus: newStatus }, performedById, ipAddress, userAgent);
//     }

//     revalidatePath("/dashboard/teachers");
//     return { ok: true, message: `Teacher account ${newStatus ? "activated" : "deactivated"} successfully` };
//   } catch (error: any) {
//     console.error("❌ Error toggling teacher status:", error);
//     return { ok: false, message: error?.message ?? "Failed to update status" };
//   }
// }

// /** ============================
//  * 5. GET TEACHERS BY SCHOOL
//  * ============================*/

// export async function getTeachersBySchool(schoolId: string) {
//   try {
//     const teachers = await db.teacher.findMany({
//       where: { schoolId },
//       include: {
//         user: { select: { id: true, email: true, status: true, isVerfied: true } },
//       },
//       orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
//     });
//     return teachers;
//   } catch (error) {
//     console.error("❌ Error fetching teachers:", error);
//     return [];
//   }
// }

// /** ============================
//  * 6. GET TEACHER BY ID
//  * ============================*/

// export async function getTeacherById(id: string) {
//   try {
//     const teacher = await db.teacher.findUnique({
//       where: { id },
//       include: {
//         user: { select: { id: true, email: true, status: true, isVerfied: true } },
//         streamSubjectAssignments: {
//           include: {
//             streamSubject: {
//               include: {
//                 subject: { select: { id: true, name: true, code: true } },
//                 
//                 stream: {
//                   include: {
//                     classYear: { include: { classTemplate: true, academicYear: true } },
//                   },
//                 },
//                 term: true,
//               },
//             },
//           },
//         },
//         paperTeachingAssignments: {
//           include: {
//             paper: { select: { id: true, paperNumber: true, name: true, paperCode: true } },
//             streamSubject: {
//               include: {
//                 subject: { select: { id: true, name: true, code: true } },
//                 stream: {
//                   include: {
//                     classYear: { include: { classTemplate: true, academicYear: true } },
//                   },
//                 },
//               },
//             },
//           },
//         },
//         headedStreams: {
//           include: { classYear: { include: { classTemplate: true } } },
//         },
//         subjectHeadOf: true,
//       },
//     });
//     return teacher;
//   } catch (error) {
//     console.error("❌ Error fetching teacher:", error);
//     return null;
//   }
// }

// /** ============================
//  * 7. GET AVAILABLE TEACHERS FOR SUBJECT
//  * ============================*/

// export async function getAvailableTeachersForSubject(schoolId: string, subjectName?: string) {
//   try {
//     const teachers = await db.teacher.findMany({
//       where: {
//         schoolId,
//         currentStatus: TeacherStatus.ACTIVE,
//         ...(subjectName && { specialization: { contains: subjectName, mode: "insensitive" } }),
//       },
//       select: { id: true, firstName: true, lastName: true, staffNo: true, specialization: true, email: true },
//       orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
//     });
//     return teachers;
//   } catch (error) {
//     console.error("❌ Error fetching available teachers:", error);
//     return [];
//   }
// }

// /** ============================
//  * 8. ENROLL TEACHER FOR ACADEMIC YEAR
//  * ============================*/

// export async function enrollTeacherForYear(
//   teacherId: string,
//   academicYearId: string,
//   remarks?: string,
//   performedById?: string
// ): Promise<ActionResponse> {
//   try {
//     const teacher = await db.teacher.findUnique({
//       where: { id: teacherId },
//       select: { id: true, firstName: true, lastName: true, staffNo: true, currentStatus: true },
//     });

//     if (!teacher) return { ok: false, message: "Teacher not found" };
//     if (teacher.currentStatus !== TeacherStatus.ACTIVE) {
//       return { ok: false, message: `Cannot enroll teacher with status: ${teacher.currentStatus}` };
//     }

//     const existing = await db.teacherYearEnrollment.findUnique({
//       where: { teacherId_academicYearId: { teacherId, academicYearId } },
//     });
//     if (existing) return { ok: false, message: "Teacher already enrolled for this academic year" };

//     const enrollment = await db.teacherYearEnrollment.create({
//       data: { teacherId, academicYearId, status: TeacherYearStatus.ACTIVE, startDate: new Date(), isActive: true, remarks },
//       include: {
//         teacher: { select: { firstName: true, lastName: true, staffNo: true } },
//         academicYear: { select: { year: true } },
//       },
//     });

//     if (performedById) {
//       await logTeacherAction("ENROLL_YEAR", teacherId, null, { academicYearId, enrollment }, performedById);
//     }

//     revalidatePath("/dashboard/teachers");
//     return {
//       ok: true,
//       data: enrollment,
//       message: `${enrollment.teacher.firstName} ${enrollment.teacher.lastName} enrolled for ${enrollment.academicYear.year}`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error enrolling teacher:", error);
//     return { ok: false, message: error?.message ?? "Failed to enroll teacher" };
//   }
// }

// /** ============================
//  * 9. BULK ENROLL TEACHERS FOR NEW YEAR
//  * ============================*/

// export async function bulkEnrollTeachersForYear(
//   schoolId: string,
//   academicYearId: string,
//   performedById?: string
// ): Promise<ActionResponse> {
//   try {
//     const activeTeachers = await db.teacher.findMany({
//       where: { schoolId, currentStatus: TeacherStatus.ACTIVE },
//       select: { id: true, firstName: true, lastName: true },
//     });

//     if (activeTeachers.length === 0) return { ok: false, message: "No active teachers found" };

//     const existingEnrollments = await db.teacherYearEnrollment.findMany({
//       where: { academicYearId, teacherId: { in: activeTeachers.map((t) => t.id) } },
//       select: { teacherId: true },
//     });

//     const existingIds = new Set(existingEnrollments.map((e) => e.teacherId));
//     const toEnroll = activeTeachers.filter((t) => !existingIds.has(t.id));

//     if (toEnroll.length === 0) return { ok: false, message: "All active teachers already enrolled" };

//     const enrollments = await db.teacherYearEnrollment.createMany({
//       data: toEnroll.map((t) => ({
//         teacherId: t.id,
//         academicYearId,
//         status: TeacherYearStatus.ACTIVE,
//         startDate: new Date(),
//         isActive: true,
//       })),
//     });

//     if (performedById) {
//       await logTeacherAction("BULK_ENROLL_YEAR", "MULTIPLE", null, { academicYearId, count: enrollments.count, teacherIds: toEnroll.map(t => t.id) }, performedById);
//     }

//     revalidatePath("/dashboard/teachers");
//     return { ok: true, data: enrollments, message: `Successfully enrolled ${enrollments.count} teacher(s)` };
//   } catch (error: any) {
//     console.error("❌ Error bulk enrolling teachers:", error);
//     return { ok: false, message: error?.message ?? "Failed to bulk enroll teachers" };
//   }
// }

// /** ============================
//  * 10. MARK TEACHER AS LEFT/RESIGNED
//  * ✅ NOW ALSO SYNCS STAFF EXIT
//  * ============================*/

// export async function markTeacherAsLeft(
//   teacherId: string,
//   academicYearId: string,
//   exitDate: Date,
//   exitReason: string,
//   finalStatus: "RESIGNED" | "RETIRED" | "TERMINATED",
//   performedById?: string
// ): Promise<ActionResponse> {
//   try {
//     if (!exitReason || exitReason.trim().length === 0) return { ok: false, message: "Exit reason is required" };
//     if (exitDate > new Date()) return { ok: false, message: "Exit date cannot be in the future" };

//     const validStatuses = ["RESIGNED", "RETIRED", "TERMINATED"];
//     if (!validStatuses.includes(finalStatus)) {
//       return { ok: false, message: "Invalid final status. Must be RESIGNED, RETIRED, or TERMINATED" };
//     }

//     const teacherStatus = finalStatus as TeacherStatus;

//     const result = await db.$transaction(async (tx) => {
//       const teacher = await tx.teacher.findUnique({
//         where: { id: teacherId },
//         select: { userId: true, firstName: true, lastName: true, currentStatus: true, staffId: true },
//       });

//       if (!teacher) throw new Error("Teacher not found");

//       // ── Update Teacher ─────────────────────────────────────────────────
//       await tx.teacher.update({
//         where: { id: teacherId },
//         data: { currentStatus: teacherStatus, status: teacherStatus, exitDate, exitReason },
//       });

//       // ── Update year enrollment ─────────────────────────────────────────
//       const enrollment = await tx.teacherYearEnrollment.findUnique({
//         where: { teacherId_academicYearId: { teacherId, academicYearId } },
//       });
//       if (enrollment) {
//         await tx.teacherYearEnrollment.update({
//           where: { teacherId_academicYearId: { teacherId, academicYearId } },
//           data: { status: TeacherYearStatus.LEFT_MID_YEAR, endDate: exitDate, exitReason, isActive: false },
//         });
//       }

//       // ── Deactivate User ────────────────────────────────────────────────
//       await tx.user.update({ where: { id: teacher.userId }, data: { status: false } });

//       // ── Sync Staff exit ────────────────────────────────────────────────
//       // If this teacher has a linked Staff record, mark the Staff as exited too
//       if (teacher.staffId) {
//         const mappedStaffStatus = toStaffStatus(teacherStatus);
//         await tx.staff.update({
//           where: { id: teacher.staffId },
//           data: {
//             status:     mappedStaffStatus,
//             exitDate,
//             exitReason: `${finalStatus} — via Teachers module`,
//           },
//         });
//       }

//       // ── Put assignments ON_HOLD ────────────────────────────────────────
//       const activeAssignments = await tx.streamSubjectTeacher.findMany({
//         where: { teacherId, status: AssignmentStatus.ACTIVE },
//         include: {
//           streamSubject: {
//             include: {
//               subject: { select: { name: true } },
//               
//               stream: { include: { classYear: { include: { classTemplate: true } } } },
//             },
//           },
//         },
//       });

//       const activePaperAssignments = await tx.streamSubjectPaperTeacher.findMany({
//         where: { teacherId, status: AssignmentStatus.ACTIVE },
//         include: { paper: { select: { paperCode: true, name: true } } },
//       });

//       await tx.streamSubjectTeacher.updateMany({
//         where: { teacherId, status: AssignmentStatus.ACTIVE },
//         data: {
//           status: AssignmentStatus.ON_HOLD,
//           reassignmentNotes: `Teacher ${finalStatus.toLowerCase()} on ${exitDate.toISOString().split("T")[0]}`,
//         },
//       });

//       await tx.streamSubjectPaperTeacher.updateMany({
//         where: { teacherId, status: AssignmentStatus.ACTIVE },
//         data: { status: AssignmentStatus.ON_HOLD },
//       });

//       return {
//         teacher,
//         assignmentsCount: activeAssignments.length,
//         paperAssignmentsCount: activePaperAssignments.length,
//         assignments: activeAssignments,
//         paperAssignments: activePaperAssignments,
//       };
//     });

//     if (performedById) {
//       await logTeacherAction(
//         "MARK_AS_LEFT",
//         teacherId,
//         { currentStatus: result.teacher.currentStatus },
//         { finalStatus, exitDate, exitReason, assignmentsAffected: result.assignmentsCount + result.paperAssignmentsCount },
//         performedById
//       );
//     }

//     revalidatePath("/dashboard/teachers");
//     revalidatePath("/dashboard/streams");

//     const totalAssignments = result.assignmentsCount + result.paperAssignmentsCount;
//     return {
//       ok: true,
//       data: result,
//       message: `${result.teacher?.firstName} ${result.teacher?.lastName} marked as ${finalStatus.toLowerCase()}. ${totalAssignments} assignment(s) need reassignment.`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error marking teacher as left:", error);
//     return { ok: false, message: error?.message ?? "Failed to update teacher status" };
//   }
// }

// /** ============================
//  * 11. GET TEACHER ASSIGNMENT HISTORY
//  * ============================*/

// export async function getTeacherAssignmentHistory(teacherId: string) {
//   try {
//     const currentAssignments = await db.streamSubjectTeacher.findMany({
//       where: { teacherId },
//       include: {
//         streamSubject: {
//           include: {
//             subject: { select: { id: true, name: true, code: true } },
//             
//             stream: { include: { classYear: { include: { classTemplate: true, academicYear: true } } } },
//             term: true,
//           },
//         },
//       },
//       orderBy: { assignedDate: "desc" },
//     });

//     const currentPaperAssignments = await db.streamSubjectPaperTeacher.findMany({
//       where: { teacherId },
//       include: {
//         paper: { select: { id: true, paperNumber: true, name: true, paperCode: true } },
//         streamSubject: {
//           include: {
//             subject: { select: { id: true, name: true, code: true } },
//             stream: { include: { classYear: { include: { classTemplate: true, academicYear: true } } } },
//             term: true,
//           },
//         },
//       },
//       orderBy: { assignedDate: "desc" },
//     });

//     const reassignedFromHistory = await db.streamSubjectTeacherHistory.findMany({
//       where: { previousTeacherId: teacherId },
//       include: {
//         newTeacher: { select: { firstName: true, lastName: true, staffNo: true } },
//         streamSubjectTeacher: {
//           include: {
//             streamSubject: {
//               include: {
//                 subject: { select: { name: true, code: true } },
//                 
//                 stream: { include: { classYear: { include: { classTemplate: true, academicYear: true } } } },
//                 term: true,
//               },
//             },
//           },
//         },
//       },
//       orderBy: { reassignedDate: "desc" },
//     });

//     const reassignedToHistory = await db.streamSubjectTeacherHistory.findMany({
//       where: { newTeacherId: teacherId },
//       include: {
//         previousTeacher: { select: { firstName: true, lastName: true, staffNo: true } },
//         streamSubjectTeacher: {
//           include: {
//             streamSubject: {
//               include: {
//                 subject: { select: { name: true, code: true } },
//                 
//                 stream: { include: { classYear: { include: { classTemplate: true, academicYear: true } } } },
//                 term: true,
//               },
//             },
//           },
//         },
//       },
//       orderBy: { reassignedDate: "desc" },
//     });

//     return {
//       ok: true,
//       data: { current: currentAssignments, currentPapers: currentPaperAssignments, reassignedFrom: reassignedFromHistory, reassignedTo: reassignedToHistory },
//     };
//   } catch (error: any) {
//     console.error("❌ Error fetching assignment history:", error);
//     return { ok: false, message: error?.message ?? "Failed to fetch history" };
//   }
// }

// /** ============================
//  * 12. GET ASSIGNMENTS NEEDING REASSIGNMENT
//  * ============================*/

// export async function getAssignmentsNeedingReassignment(schoolId: string) {
//   try {
//     const subjectAssignments = await db.streamSubjectTeacher.findMany({
//       where: { status: AssignmentStatus.ON_HOLD, streamSubject: { stream: { schoolId } } },
//       include: {
//         teacher: { select: { firstName: true, lastName: true, staffNo: true, exitReason: true, exitDate: true, currentStatus: true } },
//         streamSubject: {
//           include: {
//             subject: { select: { id: true, name: true, code: true } },
//             
//             stream: { include: { classYear: { include: { classTemplate: true, academicYear: true } } } },
//             term: true,
//             studentEnrollments: {
//               select: {
//                 id: true,
//                 enrollment: { select: { student: { select: { firstName: true, lastName: true, admissionNo: true } } } },
//               },
//             },
//           },
//         },
//       },
//       orderBy: { assignedDate: "desc" },
//     });

//     const paperAssignments = await db.streamSubjectPaperTeacher.findMany({
//       where: { status: AssignmentStatus.ON_HOLD, streamSubject: { stream: { schoolId } } },
//       include: {
//         teacher: { select: { firstName: true, lastName: true, staffNo: true, exitReason: true, exitDate: true, currentStatus: true } },
//         paper: { select: { id: true, paperNumber: true, name: true, paperCode: true } },
//         streamSubject: {
//           include: {
//             subject: { select: { id: true, name: true, code: true } },
//             stream: { include: { classYear: { include: { classTemplate: true, academicYear: true } } } },
//             term: true,
//           },
//         },
//       },
//       orderBy: { assignedDate: "desc" },
//     });

//     return {
//       ok: true,
//       data: { subjectAssignments, paperAssignments, totalCount: subjectAssignments.length + paperAssignments.length },
//     };
//   } catch (error: any) {
//     console.error("❌ Error fetching assignments needing reassignment:", error);
//     return { ok: false, message: error?.message ?? "Failed to fetch assignments" };
//   }
// }

// /** ============================
//  * 13. GET CURRENT TEACHER ASSIGNMENTS
//  * ============================*/

// export async function getCurrentTeacherAssignments(teacherId: string, termId?: string) {
//   try {
//     const whereClause = {
//       teacherId,
//       status: AssignmentStatus.ACTIVE,
//       ...(termId && { streamSubject: { termId } }),
//     };

//     const [assignments, paperAssignments] = await Promise.all([
//       db.streamSubjectTeacher.findMany({
//         where: whereClause,
//         include: {
//           streamSubject: {
//             include: {
//               subject: { select: { id: true, name: true, code: true } },
//               
//               stream: { include: { classYear: { include: { classTemplate: true, academicYear: true } } } },
//               term: true,
//               studentEnrollments: {
//                 include: {
//                   enrollment: { include: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } } },
//                 },
//               },
//             },
//           },
//         },
//         orderBy: { assignedDate: "desc" },
//       }),
//       db.streamSubjectPaperTeacher.findMany({
//         where: whereClause,
//         include: {
//           paper: { select: { id: true, paperNumber: true, name: true, paperCode: true } },
//           streamSubject: {
//             include: {
//               subject: { select: { id: true, name: true, code: true } },
//               stream: { include: { classYear: { include: { classTemplate: true, academicYear: true } } } },
//               term: true,
//               studentEnrollments: {
//                 include: {
//                   enrollment: { include: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } } },
//                 },
//               },
//             },
//           },
//         },
//         orderBy: { assignedDate: "desc" },
//       }),
//     ]);

//     return {
//       ok: true,
//       data: { subjectAssignments: assignments, paperAssignments, totalCount: assignments.length + paperAssignments.length },
//     };
//   } catch (error: any) {
//     console.error("❌ Error fetching current assignments:", error);
//     return { ok: false, message: error?.message ?? "Failed to fetch assignments" };
//   }
// }

// /** ============================
//  * 14. GET TEACHERS BY SCHOOL (Enhanced)
//  * ============================*/

// export async function getTeachersBySchoolEnhanced(schoolId: string, academicYearId?: string, includeInactive = false) {
//   try {
//     const teachers = await db.teacher.findMany({
//       where: {
//         schoolId,
//         ...(includeInactive ? {} : { currentStatus: TeacherStatus.ACTIVE }),
//       },
//       include: {
//         user: { select: { id: true, email: true, status: true, isVerfied: true } },
//         yearEnrollments: {
//           where: academicYearId ? { academicYearId } : undefined,
//           include: { academicYear: true },
//         },
//         streamSubjectAssignments: {
//           where: { status: AssignmentStatus.ACTIVE },
//           include: {
//             streamSubject: {
//               include: {
//                 subject: { select: { id: true, name: true, code: true } },
//                 
//                 stream: { include: { classYear: { include: { classTemplate: true } } } },
//                 term: true,
//               },
//             },
//           },
//         },
//         paperTeachingAssignments: {
//           where: { status: AssignmentStatus.ACTIVE },
//           include: {
//             paper: { select: { id: true, paperNumber: true, name: true, paperCode: true } },
//             streamSubject: {
//               include: {
//                 subject: { select: { id: true, name: true, code: true } },
//                 stream: { include: { classYear: { include: { classTemplate: true } } } },
//               },
//             },
//           },
//         },
//         headedStreams: { include: { classYear: { include: { classTemplate: true } } } },
//         subjectHeadOf: true,
//       },
//       orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
//     });
//     return teachers;
//   } catch (error) {
//     console.error("❌ Error fetching teachers:", error);
//     return [];
//   }
// }

// /** ============================
//  * 15. GET TEACHER STATISTICS
//  * ============================*/

// export async function getTeacherStatistics(schoolId: string, academicYearId?: string) {
//   try {
//     const [
//       totalTeachers, activeTeachers, onLeaveTeachers, totalEnrollments,
//       totalAssignments, totalPaperAssignments,
//       assignmentsNeedingReassignment, paperAssignmentsNeedingReassignment,
//     ] = await Promise.all([
//       db.teacher.count({ where: { schoolId } }),
//       db.teacher.count({ where: { schoolId, currentStatus: TeacherStatus.ACTIVE } }),
//       db.teacher.count({ where: { schoolId, currentStatus: TeacherStatus.ON_LEAVE } }),
//       academicYearId ? db.teacherYearEnrollment.count({ where: { academicYearId, teacher: { schoolId } } }) : 0,
//       db.streamSubjectTeacher.count({ where: { teacher: { schoolId }, status: AssignmentStatus.ACTIVE } }),
//       db.streamSubjectPaperTeacher.count({ where: { teacher: { schoolId }, status: AssignmentStatus.ACTIVE } }),
//       db.streamSubjectTeacher.count({ where: { teacher: { schoolId }, status: AssignmentStatus.ON_HOLD } }),
//       db.streamSubjectPaperTeacher.count({ where: { teacher: { schoolId }, status: AssignmentStatus.ON_HOLD } }),
//     ]);

//     return {
//       ok: true,
//       data: {
//         totalTeachers, activeTeachers, onLeaveTeachers,
//         inactiveTeachers: totalTeachers - activeTeachers - onLeaveTeachers,
//         totalEnrollments, totalAssignments, totalPaperAssignments,
//         assignmentsNeedingReassignment, paperAssignmentsNeedingReassignment,
//         totalAssignmentsNeedingReassignment: assignmentsNeedingReassignment + paperAssignmentsNeedingReassignment,
//       },
//     };
//   } catch (error: any) {
//     console.error("❌ Error fetching teacher statistics:", error);
//     return { ok: false, message: error?.message ?? "Failed to fetch statistics" };
//   }
// }

// /** ============================
//  * 16. SEARCH TEACHERS
//  * ============================*/

// export async function searchTeachers(
//   schoolId: string,
//   searchTerm: string,
//   filters?: { status?: TeacherStatus; specialization?: string; employmentType?: string }
// ) {
//   try {
//     const whereClause: Prisma.TeacherWhereInput = {
//       schoolId,
//       AND: [
//         {
//           OR: [
//             { firstName: { contains: searchTerm, mode: "insensitive" } },
//             { lastName: { contains: searchTerm, mode: "insensitive" } },
//             { email: { contains: searchTerm, mode: "insensitive" } },
//             { staffNo: { contains: searchTerm, mode: "insensitive" } },
//           ],
//         },
//       ],
//     };

//     if (filters?.status)          whereClause.currentStatus = filters.status;
//     if (filters?.specialization)  whereClause.specialization = { contains: filters.specialization, mode: "insensitive" };
//     if (filters?.employmentType)  whereClause.employmentType = filters.employmentType;

//     const teachers = await db.teacher.findMany({
//       where: whereClause,
//       include: { user: { select: { id: true, email: true, status: true } } },
//       orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
//       take: 50,
//     });

//     return { ok: true, data: teachers };
//   } catch (error: any) {
//     console.error("❌ Error searching teachers:", error);
//     return { ok: false, message: error?.message ?? "Failed to search teachers" };
//   }
// }





"use server";

import { db } from "@/prisma/db";
import bcrypt from "bcryptjs";
import { Prisma, TeacherStatus, TeacherYearStatus, AssignmentStatus, StaffStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

/** ============================
 * UTILITY FUNCTIONS
 * ============================*/

async function generateStaffNo(schoolId: string): Promise<string> {
  const school = await db.school.findUnique({
    where:  { id: schoolId },
    select: { code: true },
  });
  const schoolCode = (school?.code ?? "SCH").slice(0, 3).toUpperCase();

  const now = new Date();
  const year = now.getFullYear();
  const monthStr = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `${schoolCode}TCH${year}${monthStr}`;

  const latest = await db.teacher.findFirst({
    where:   { schoolId, staffNo: { startsWith: prefix } },
    orderBy: { staffNo: "desc" },
    select:  { staffNo: true },
  });

  let seq = 1;
  if (latest?.staffNo) {
    const parsed = parseInt(latest.staffNo.slice(prefix.length), 10);
    if (!isNaN(parsed)) seq = parsed + 1;
  }

  return `${prefix}${String(seq).padStart(3, "0")}`;
}

function toDateOrNull(d?: string | null): Date | null {
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day || isNaN(y) || isNaN(m) || isNaN(day)) return null;
  if (m < 1 || m > 12 || day < 1 || day > 31) return null;
  return new Date(Date.UTC(y, m - 1, day, 12, 0, 0));
}

function validateTeacherStatus(status?: string | null): TeacherStatus {
  if (!status) return TeacherStatus.ACTIVE;
  const validStatuses = Object.values(TeacherStatus);
  if (validStatuses.includes(status as TeacherStatus)) return status as TeacherStatus;
  return TeacherStatus.ACTIVE;
}

function toStaffStatus(teacherStatus: TeacherStatus): StaffStatus {
  const map: Record<TeacherStatus, StaffStatus> = {
    [TeacherStatus.ACTIVE]:     StaffStatus.ACTIVE,
    [TeacherStatus.ON_LEAVE]:   StaffStatus.ON_LEAVE,
    [TeacherStatus.SUSPENDED]:  StaffStatus.SUSPENDED,
    [TeacherStatus.RESIGNED]:   StaffStatus.RESIGNED,
    [TeacherStatus.TERMINATED]: StaffStatus.TERMINATED,
    [TeacherStatus.RETIRED]:    StaffStatus.RETIRED,
  };
  return map[teacherStatus] ?? StaffStatus.ACTIVE;
}

async function logTeacherAction(
  action: string,
  teacherId: string,
  previousValue: any,
  newValue: any,
  performedById: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await db.markAuditLog.create({
      data: {
        entityType: "Teacher",
        entityId: teacherId,
        action,
        previousValue: previousValue || Prisma.JsonNull,
        newValue: newValue || Prisma.JsonNull,
        performedById,
        performedAt: new Date(),
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("❌ Failed to create audit log:", error);
  }
}

/** ============================
 * TYPES
 * ============================*/

type CreateTeacherPayload = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  schoolId: string;
  gender: string;
  dateOfBirth: string;
  employmentType: string;
  role: string;
  nationality?: string | null;
  nationalId?: string | null;
  maritalStatus?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyRelationship?: string | null;
  emergencyPhone?: string | null;
  emergencyEmail?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  teachingLevel?: string | null;
  experienceYears?: number | null;
  previousSchools?: string[];
  dateOfHire?: string | null;
  highestQualification?: string | null;
  institutionAttended?: string | null;
  professionalTraining?: string | null;
  ongoingStudies?: string | null;
  profilePhoto?: string | null;
  documents?: string | null;
  healthInfo?: string | null;
  currentStatus?: TeacherStatus;
  performedById?: string;
  ipAddress?: string;
  userAgent?: string;
};

type UpdateTeacherPayload = Partial<Omit<CreateTeacherPayload, "password" | "schoolId">>;

type ActionResponse<T = any> = {
  ok: boolean;
  message: string;
  data?: T;
};

/** ============================
 * 1. CREATE TEACHER WITH USER
 * ============================*/

export async function createTeacherWithUser(
  data: CreateTeacherPayload
): Promise<ActionResponse> {
  try {
    const {
      email, phone, firstName, lastName, password, schoolId, gender,
      dateOfBirth, employmentType, role, nationality, nationalId, maritalStatus,
      address, emergencyContactName, emergencyRelationship, emergencyPhone,
      emergencyEmail, qualification, specialization, teachingLevel, experienceYears,
      previousSchools, dateOfHire, highestQualification, institutionAttended,
      professionalTraining, ongoingStudies, profilePhoto, documents, healthInfo,
      currentStatus, performedById, ipAddress, userAgent,
    } = data;

    if (!email || !phone || !firstName || !lastName || !password) {
      return { ok: false, message: "Required fields are missing" };
    }
    if (!schoolId) return { ok: false, message: "School ID is required" };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { ok: false, message: "Invalid email format" };
    if (phone.length < 10) return { ok: false, message: "Phone number must be at least 10 digits" };

    const parsedDOB = toDateOrNull(dateOfBirth);
    if (!parsedDOB) return { ok: false, message: "Invalid date of birth format. Use YYYY-MM-DD" };
    if (parsedDOB > new Date()) return { ok: false, message: "Date of birth cannot be in the future" };

    const parsedHireDate = dateOfHire ? toDateOrNull(dateOfHire) : new Date();
    if (dateOfHire && !parsedHireDate) return { ok: false, message: "Invalid hire date format. Use YYYY-MM-DD" };

    const existingUser = await db.user.findFirst({ where: { OR: [{ email }, { phone }] } });
    if (existingUser) return { ok: false, message: "User with this email or phone already exists." };

    const [byPhone, byEmail, byNatId] = await Promise.all([
      db.teacher.findUnique({ where: { phone } }),
      db.teacher.findUnique({ where: { email } }),
      nationalId ? db.teacher.findUnique({ where: { nationalId } }) : Promise.resolve(null),
    ]);

    if (byPhone) return { ok: false, message: "Teacher phone already exists." };
    if (byEmail)  return { ok: false, message: "Teacher email already exists." };
    if (byNatId)  return { ok: false, message: "Teacher National ID already exists." };

    const hashedPassword = await bcrypt.hash(password, 10);
    const name = `${firstName} ${lastName}`.trim();
    const staffNo = await generateStaffNo(schoolId);
    const validatedStatus = validateTeacherStatus(currentStatus);

    const teacher = await db.$transaction(async (tx) => {
      const teacherRole = await tx.role.upsert({
        where: { roleName: "teacher" },
        create: {
          roleName: "teacher",
          displayName: "Teacher",
          permissions: ["view_classes", "manage_marks", "view_students"],
        },
        update: {},
      });

      const user = await tx.user.create({
        data: {
          email, phone, firstName, lastName, name,
          password: hashedPassword,
          status: true,
          isVerfied: false,
          roles: { connect: [{ id: teacherRole.id }] },
        },
      });

      const newTeacher = await tx.teacher.create({
        data: {
          userId: user.id, schoolId, staffNo, firstName, lastName, gender,
          dateOfBirth: parsedDOB,
          nationality: nationality || null,
          nationalId: nationalId || null,
          maritalStatus: maritalStatus || null,
          phone, email,
          address: address || null,
          emergencyContactName: emergencyContactName || null,
          emergencyRelationship: emergencyRelationship || null,
          emergencyPhone: emergencyPhone || null,
          emergencyEmail: emergencyEmail || null,
          qualification: qualification || null,
          specialization: specialization || null,
          teachingLevel: teachingLevel || null,
          experienceYears: experienceYears || null,
          previousSchools: previousSchools || [],
          dateOfHire: parsedHireDate || new Date(),
          employmentType, role,
          currentStatus: validatedStatus,
          status: validatedStatus,
          highestQualification: highestQualification || null,
          institutionAttended: institutionAttended || null,
          professionalTraining: professionalTraining || null,
          ongoingStudies: ongoingStudies || null,
          profilePhoto: profilePhoto || null,
          documents: documents || null,
          healthInfo: healthInfo || null,
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      });

      return newTeacher;
    });

    if (performedById) {
      await logTeacherAction("CREATE", teacher.id, null, { teacher, user: teacher.user }, performedById, ipAddress, userAgent);
    }

    revalidatePath("/dashboard/teachers");
    return {
      ok: true,
      data: teacher,
      message: `Teacher ${teacher.firstName} ${teacher.lastName} registered successfully with Staff No: ${staffNo}`,
    };
  } catch (error: any) {
    console.error("❌ Error registering teacher:", error);
    if (error.code === "P2002") return { ok: false, message: "A teacher with this information already exists (duplicate constraint)" };
    return { ok: false, message: error?.message ?? "Failed to register teacher" };
  }
}

/** ============================
 * 2. UPDATE TEACHER
 * ============================*/

export async function updateTeacher(
  id: string,
  data: UpdateTeacherPayload
): Promise<ActionResponse> {
  try {
    const {
      email, phone, firstName, lastName, gender, dateOfBirth, nationality,
      nationalId, maritalStatus, address, emergencyContactName, emergencyRelationship,
      emergencyPhone, emergencyEmail, qualification, specialization, teachingLevel,
      experienceYears, previousSchools, dateOfHire, employmentType, role,
      highestQualification, institutionAttended, professionalTraining, ongoingStudies,
      profilePhoto, documents, healthInfo, currentStatus, performedById, ipAddress, userAgent,
    } = data;

    const existingTeacher = await db.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        staff: { select: { id: true, userId: true, basicSalary: true } },
      },
    });

    if (!existingTeacher) return { ok: false, message: "Teacher not found" };

    let parsedDOB: Date | null | undefined = undefined;
    if (dateOfBirth !== undefined) {
      parsedDOB = toDateOrNull(dateOfBirth);
      if (dateOfBirth && !parsedDOB) return { ok: false, message: "Invalid date of birth format. Use YYYY-MM-DD" };
      if (parsedDOB && parsedDOB > new Date()) return { ok: false, message: "Date of birth cannot be in the future" };
    }

    let parsedHireDate: Date | null | undefined = undefined;
    if (dateOfHire !== undefined) {
      parsedHireDate = toDateOrNull(dateOfHire);
      if (dateOfHire && !parsedHireDate) return { ok: false, message: "Invalid hire date format. Use YYYY-MM-DD" };
    }

    if (email && email !== existingTeacher.email) {
      const emailExists = await db.teacher.findUnique({ where: { email } });
      if (emailExists) return { ok: false, message: "Email already in use by another teacher" };
    }
    if (phone && phone !== existingTeacher.phone) {
      const phoneExists = await db.teacher.findUnique({ where: { phone } });
      if (phoneExists) return { ok: false, message: "Phone already in use by another teacher" };
    }
    if (nationalId && nationalId !== existingTeacher.nationalId) {
      const idExists = await db.teacher.findUnique({ where: { nationalId } });
      if (idExists) return { ok: false, message: "National ID already in use by another teacher" };
    }

    const updatedTeacher = await db.$transaction(async (tx) => {
      // ── 1. Update User ─────────────────────────────────────────────────
      const userUpdateData: Prisma.UserUpdateInput = {};
      if (email !== undefined) userUpdateData.email = email;
      if (phone !== undefined) userUpdateData.phone = phone;
      if (firstName !== undefined) userUpdateData.firstName = firstName;
      if (lastName !== undefined)  userUpdateData.lastName  = lastName;
      if (firstName !== undefined && lastName !== undefined) {
        userUpdateData.name = `${firstName} ${lastName}`;
      } else if (firstName !== undefined) {
        userUpdateData.name = `${firstName} ${existingTeacher.lastName}`;
      } else if (lastName !== undefined) {
        userUpdateData.name = `${existingTeacher.firstName} ${lastName}`;
      }

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({ where: { id: existingTeacher.userId }, data: userUpdateData });
      }

      // ── 2. Update Teacher ──────────────────────────────────────────────
      const teacherUpdateData: Prisma.TeacherUpdateInput = {};

      if (firstName !== undefined)            teacherUpdateData.firstName            = firstName;
      if (lastName !== undefined)             teacherUpdateData.lastName             = lastName;
      if (gender !== undefined)               teacherUpdateData.gender               = gender;
      if (parsedDOB !== undefined)            teacherUpdateData.dateOfBirth          = parsedDOB === null ? undefined : parsedDOB;
      if (nationality !== undefined)          teacherUpdateData.nationality          = nationality;
      if (nationalId !== undefined)           teacherUpdateData.nationalId           = nationalId;
      if (maritalStatus !== undefined)        teacherUpdateData.maritalStatus        = maritalStatus;
      if (phone !== undefined)                teacherUpdateData.phone                = phone;
      if (email !== undefined)                teacherUpdateData.email                = email;
      if (address !== undefined)              teacherUpdateData.address              = address;
      if (emergencyContactName !== undefined) teacherUpdateData.emergencyContactName = emergencyContactName;
      if (emergencyRelationship !== undefined) teacherUpdateData.emergencyRelationship = emergencyRelationship;
      if (emergencyPhone !== undefined)       teacherUpdateData.emergencyPhone       = emergencyPhone;
      if (emergencyEmail !== undefined)       teacherUpdateData.emergencyEmail       = emergencyEmail;
      if (qualification !== undefined)        teacherUpdateData.qualification        = qualification;
      if (specialization !== undefined)       teacherUpdateData.specialization       = specialization;
      if (teachingLevel !== undefined)        teacherUpdateData.teachingLevel        = teachingLevel;
      if (experienceYears !== undefined) {
        teacherUpdateData.experienceYears =
          experienceYears === null || experienceYears === ("" as any)
            ? null
            : typeof experienceYears === "string"
            ? parseInt(experienceYears as any, 10) || null
            : experienceYears;
      }
      if (previousSchools !== undefined)      teacherUpdateData.previousSchools      = previousSchools;
      if (parsedHireDate !== undefined)       teacherUpdateData.dateOfHire           = parsedHireDate === null ? undefined : parsedHireDate;
      if (employmentType !== undefined)       teacherUpdateData.employmentType       = employmentType;
      if (role !== undefined)                 teacherUpdateData.role                 = role;
      if (highestQualification !== undefined) teacherUpdateData.highestQualification = highestQualification;
      if (institutionAttended !== undefined)  teacherUpdateData.institutionAttended  = institutionAttended;
      if (professionalTraining !== undefined) teacherUpdateData.professionalTraining = professionalTraining;
      if (ongoingStudies !== undefined)       teacherUpdateData.ongoingStudies       = ongoingStudies;
      if (profilePhoto !== undefined)         teacherUpdateData.profilePhoto         = profilePhoto;
      if (documents !== undefined)            teacherUpdateData.documents            = documents;
      if (healthInfo !== undefined)           teacherUpdateData.healthInfo           = healthInfo;

      if (currentStatus !== undefined) {
        const validatedStatus = validateTeacherStatus(currentStatus);
        teacherUpdateData.currentStatus = validatedStatus;
        teacherUpdateData.status        = validatedStatus;
      }

      const teacher = await tx.teacher.update({
        where: { id },
        data: teacherUpdateData,
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      });

      // ── 3. Sync Staff record ───────────────────────────────────────────
      // Prefer staffId on Teacher; fall back to finding Staff via shared userId
      let staffRecordId: string | null = existingTeacher.staffId ?? null;
      if (!staffRecordId) {
        const linkedStaff = await tx.staff.findFirst({
          where: { userId: existingTeacher.userId },
          select: { id: true },
        });
        staffRecordId = linkedStaff?.id ?? null;
      }

      if (staffRecordId) {
        const staffUpdate: Prisma.StaffUpdateInput = {};

        if (firstName !== undefined)               staffUpdate.firstName             = firstName;
        if (lastName !== undefined)                staffUpdate.lastName              = lastName;
        if (gender !== undefined)                  staffUpdate.gender                = gender;
        if (parsedDOB !== undefined && parsedDOB !== null)
                                                   staffUpdate.dob                   = parsedDOB;
        if (nationality !== undefined)             staffUpdate.nationality           = nationality;
        if (nationalId !== undefined)              staffUpdate.nationalId            = nationalId;
        if (phone !== undefined)                   staffUpdate.phone                 = phone;
        if (email !== undefined)                   staffUpdate.email                 = email;
        if (address !== undefined)                 staffUpdate.address               = address;
        if (profilePhoto !== undefined)            staffUpdate.imageUrl              = profilePhoto;
        if (highestQualification !== undefined)    staffUpdate.highestQualification  = highestQualification;
        if (institutionAttended !== undefined)     staffUpdate.institutionAttended   = institutionAttended;
        if (specialization !== undefined)          staffUpdate.specialization        = specialization;
        if (professionalTraining !== undefined)    staffUpdate.professionalTraining  = professionalTraining;
        if (emergencyContactName !== undefined)    staffUpdate.emergencyName         = emergencyContactName;
        if (emergencyPhone !== undefined)          staffUpdate.emergencyPhone        = emergencyPhone;
        if (emergencyRelationship !== undefined)   staffUpdate.emergencyRelationship = emergencyRelationship;
        if (employmentType !== undefined) {
          const empTypeMap: Record<string, string> = {
            fulltime: "PERMANENT",
            full_time: "PERMANENT",
            FULL_TIME: "PERMANENT",
            parttime: "PART_TIME",
            part_time: "PART_TIME",
            PART_TIME: "PART_TIME",
            contract: "CONTRACT",
            CONTRACT: "CONTRACT",
            volunteer: "VOLUNTEER",
            VOLUNTEER: "VOLUNTEER",
            intern: "INTERN",
            INTERN: "INTERN",
          };
          const mappedEmpType = empTypeMap[employmentType] ?? "PERMANENT";
          staffUpdate.employmentType = mappedEmpType as any;
        }
        if (parsedHireDate !== undefined && parsedHireDate !== null)
                                                   staffUpdate.dateOfHire            = parsedHireDate;

        if (currentStatus !== undefined) {
          const validatedStatus = validateTeacherStatus(currentStatus);
          const mappedStaffStatus = toStaffStatus(validatedStatus);
          staffUpdate.status = mappedStaffStatus;
          if (["RESIGNED", "TERMINATED", "RETIRED"].includes(mappedStaffStatus)) {
            staffUpdate.exitDate   = new Date();
            staffUpdate.exitReason = `${mappedStaffStatus} — updated via Teachers module`;
          }
        }

        if (Object.keys(staffUpdate).length > 0) {
          await tx.staff.update({
            where: { id: staffRecordId },
            data: staffUpdate,
          });
        }
      }

      return teacher;
    });

    if (performedById) {
      await logTeacherAction("UPDATE", id, existingTeacher, updatedTeacher, performedById, ipAddress, userAgent);
    }

    revalidatePath("/dashboard/teachers");
    return {
      ok: true,
      data: updatedTeacher,
      message: `Teacher ${updatedTeacher.firstName} ${updatedTeacher.lastName} updated successfully`,
    };
  } catch (error: any) {
    console.error("❌ Error updating teacher:", error);
    if (error.code === "P2002") return { ok: false, message: "Update failed due to duplicate constraint (email, phone, or national ID)" };
    return { ok: false, message: error?.message ?? "Failed to update teacher" };
  }
}

/** ============================
 * 3. DELETE TEACHER
 *
 * FIX [1]: Removed db.streamSubjectPaperTeacher.count() — model removed from schema.
 * Paper-level teacher assignment is now handled by StreamSubjectTeacher
 * (one row per paper since StreamSubject is paper-scoped).
 * ============================*/

export async function deleteTeacher(
  id: string,
  performedById?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ActionResponse> {
  try {
    const teacher = await db.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher) return { ok: false, message: "Teacher not found" };

    const [
      activeAssignments,
      headedStreams,
      headedSubjects,
      aoiUnitsCount,
      aoiScoresCount,
      examMarksCount,
    ] = await Promise.all([
      db.streamSubjectTeacher.count({ where: { teacherId: id, status: AssignmentStatus.ACTIVE } }),
      db.stream.count({ where: { classHeadId: id } }),
      db.subject.count({ where: { headTeacherId: id } }),
      db.aOIUnit.count({ where: { enteredById: id } }),
      db.aOIScore.count({ where: { enteredById: id } }),
      db.examMark.count({ where: { enteredById: id } }),
    ]);

    const issues: string[] = [];
    if (activeAssignments > 0) issues.push(`${activeAssignments} active subject assignment(s)`);
    if (headedStreams > 0)     issues.push(`head of ${headedStreams} stream(s)`);
    if (headedSubjects > 0)    issues.push(`head of ${headedSubjects} subject(s)`);
    if (aoiUnitsCount > 0)     issues.push(`${aoiUnitsCount} AOI unit(s) entered`);
    if (aoiScoresCount > 0)    issues.push(`${aoiScoresCount} AOI score(s) entered`);
    if (examMarksCount > 0)    issues.push(`${examMarksCount} exam mark(s) entered`);

    if (issues.length > 0) {
      return {
        ok: false,
        message: `Cannot delete teacher. Blockers: ${issues.join(", ")}. Please resolve these first.`,
      };
    }

    const teacherInfo = {
      id: teacher.id,
      name: `${teacher.firstName} ${teacher.lastName}`,
      staffNo: teacher.staffNo,
      email: teacher.email,
    };

    await db.teacher.delete({ where: { id } });

    if (performedById) {
      await logTeacherAction("DELETE", id, teacherInfo, null, performedById, ipAddress, userAgent);
    }

    revalidatePath("/dashboard/teachers");
    return { ok: true, message: `Teacher ${teacher.firstName} ${teacher.lastName} deleted successfully` };
  } catch (error: any) {
    console.error("❌ Error deleting teacher:", error);
    return { ok: false, message: error?.message ?? "Failed to delete teacher" };
  }
}

/** ============================
 * 4. TOGGLE TEACHER STATUS
 * ============================*/

export async function toggleTeacherStatus(
  teacherId: string,
  currentStatus: boolean,
  performedById?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ActionResponse> {
  try {
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });

    if (!teacher) return { ok: false, message: "Teacher not found" };

    const previousStatus = teacher.user.status;
    const newStatus = !currentStatus;

    await db.user.update({
      where: { id: teacher.userId },
      data: { status: newStatus },
    });

    if (performedById) {
      await logTeacherAction("TOGGLE_STATUS", teacherId, { userStatus: previousStatus }, { userStatus: newStatus }, performedById, ipAddress, userAgent);
    }

    revalidatePath("/dashboard/teachers");
    return { ok: true, message: `Teacher account ${newStatus ? "activated" : "deactivated"} successfully` };
  } catch (error: any) {
    console.error("❌ Error toggling teacher status:", error);
    return { ok: false, message: error?.message ?? "Failed to update status" };
  }
}

/** ============================
 * 5. GET TEACHERS BY SCHOOL
 * ============================*/

export async function getTeachersBySchool(schoolId: string) {
  try {
    const teachers = await db.teacher.findMany({
      where: { schoolId },
      include: {
        user: { select: { id: true, email: true, status: true, isVerfied: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
    return teachers;
  } catch (error) {
    console.error("❌ Error fetching teachers:", error);
    return [];
  }
}

/** ============================
 * 6. GET TEACHER BY ID
 *
 * FIX [3]: Removed paperTeachingAssignments include — relation removed from schema.
 * Paper assignments are now embedded in streamSubjectAssignments since each
 * StreamSubject row is already paper-scoped.
 * ============================*/

export async function getTeacherById(id: string) {
  try {
    const teacher = await db.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, status: true, isVerfied: true } },
        streamSubjectAssignments: {
          include: {
            streamSubject: {
              include: {
                subject: { select: { id: true, name: true, code: true } },
                
                stream: {
                  include: {
                    classYear: { include: { classTemplate: true, academicYear: true } },
                  },
                },
                term: true,
              },
            },
          },
        },
        headedStreams: {
          include: { classYear: { include: { classTemplate: true } } },
        },
        subjectHeadOf: true,
      },
    });
    return teacher;
  } catch (error) {
    console.error("❌ Error fetching teacher:", error);
    return null;
  }
}

/** ============================
 * 7. GET AVAILABLE TEACHERS FOR SUBJECT
 * ============================*/

export async function getAvailableTeachersForSubject(schoolId: string, subjectName?: string) {
  try {
    // Return ALL active teachers for the school.
    // We no longer filter by specialization because most teachers won't have it
    // set to exactly match the subject name — that would return 0 results.
    // Teachers are sorted so those whose specialization matches the subject
    // appear first (via client-side sort), but all active staff are assignable.
    const teachers = await db.teacher.findMany({
      where: {
        schoolId,
        OR: [
          { currentStatus: TeacherStatus.ACTIVE },
          { status: "ACTIVE" },
        ],
      },
      select: { id: true, firstName: true, lastName: true, staffNo: true, specialization: true, email: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    if (!subjectName) return teachers;

    // Put teachers whose specialization contains the subject name first
    const lower = subjectName.toLowerCase();
    return [
      ...teachers.filter(t => t.specialization?.toLowerCase().includes(lower)),
      ...teachers.filter(t => !t.specialization?.toLowerCase().includes(lower)),
    ];
  } catch (error) {
    console.error("❌ Error fetching available teachers:", error);
    return [];
  }
}

/** ============================
 * 8. ENROLL TEACHER FOR ACADEMIC YEAR
 * ============================*/

export async function enrollTeacherForYear(
  teacherId: string,
  academicYearId: string,
  remarks?: string,
  performedById?: string
): Promise<ActionResponse> {
  try {
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, firstName: true, lastName: true, staffNo: true, currentStatus: true },
    });

    if (!teacher) return { ok: false, message: "Teacher not found" };
    if (teacher.currentStatus !== TeacherStatus.ACTIVE) {
      return { ok: false, message: `Cannot enroll teacher with status: ${teacher.currentStatus}` };
    }

    const existing = await db.teacherYearEnrollment.findUnique({
      where: { teacherId_academicYearId: { teacherId, academicYearId } },
    });
    if (existing) return { ok: false, message: "Teacher already enrolled for this academic year" };

    const enrollment = await db.teacherYearEnrollment.create({
      data: { teacherId, academicYearId, status: TeacherYearStatus.ACTIVE, startDate: new Date(), isActive: true, remarks },
      include: {
        teacher: { select: { firstName: true, lastName: true, staffNo: true } },
        academicYear: { select: { year: true } },
      },
    });

    if (performedById) {
      await logTeacherAction("ENROLL_YEAR", teacherId, null, { academicYearId, enrollment }, performedById);
    }

    revalidatePath("/dashboard/teachers");
    return {
      ok: true,
      data: enrollment,
      message: `${enrollment.teacher.firstName} ${enrollment.teacher.lastName} enrolled for ${enrollment.academicYear.year}`,
    };
  } catch (error: any) {
    console.error("❌ Error enrolling teacher:", error);
    return { ok: false, message: error?.message ?? "Failed to enroll teacher" };
  }
}

/** ============================
 * 9. BULK ENROLL TEACHERS FOR NEW YEAR
 * ============================*/

export async function bulkEnrollTeachersForYear(
  schoolId: string,
  academicYearId: string,
  performedById?: string
): Promise<ActionResponse> {
  try {
    const activeTeachers = await db.teacher.findMany({
      where: { schoolId, currentStatus: TeacherStatus.ACTIVE },
      select: { id: true, firstName: true, lastName: true },
    });

    if (activeTeachers.length === 0) return { ok: false, message: "No active teachers found" };

    const existingEnrollments = await db.teacherYearEnrollment.findMany({
      where: { academicYearId, teacherId: { in: activeTeachers.map((t) => t.id) } },
      select: { teacherId: true },
    });

    const existingIds = new Set(existingEnrollments.map((e) => e.teacherId));
    const toEnroll = activeTeachers.filter((t) => !existingIds.has(t.id));

    if (toEnroll.length === 0) return { ok: false, message: "All active teachers already enrolled" };

    const enrollments = await db.teacherYearEnrollment.createMany({
      data: toEnroll.map((t) => ({
        teacherId: t.id,
        academicYearId,
        status: TeacherYearStatus.ACTIVE,
        startDate: new Date(),
        isActive: true,
      })),
    });

    if (performedById) {
      await logTeacherAction("BULK_ENROLL_YEAR", "MULTIPLE", null, { academicYearId, count: enrollments.count, teacherIds: toEnroll.map(t => t.id) }, performedById);
    }

    revalidatePath("/school", "layout");
    return { ok: true, data: enrollments, message: `Successfully enrolled ${enrollments.count} teacher(s)` };
  } catch (error: any) {
    console.error("❌ Error bulk enrolling teachers:", error);
    return { ok: false, message: error?.message ?? "Failed to bulk enroll teachers" };
  }
}

/** ============================
 * 10. MARK TEACHER AS LEFT / RESIGNED
 *
 * FIX [2]: Removed all StreamSubjectPaperTeacher queries — model removed from schema.
 * StreamSubjectTeacher now covers paper-level assignments since one StreamSubject
 * exists per paper. All ON_HOLD logic applies only to StreamSubjectTeacher.
 * ============================*/

export async function markTeacherAsLeft(
  teacherId: string,
  academicYearId: string,
  exitDate: Date,
  exitReason: string,
  finalStatus: "RESIGNED" | "RETIRED" | "TERMINATED",
  performedById?: string
): Promise<ActionResponse> {
  try {
    if (!exitReason || exitReason.trim().length === 0) return { ok: false, message: "Exit reason is required" };
    if (exitDate > new Date()) return { ok: false, message: "Exit date cannot be in the future" };

    const validStatuses = ["RESIGNED", "RETIRED", "TERMINATED"];
    if (!validStatuses.includes(finalStatus)) {
      return { ok: false, message: "Invalid final status. Must be RESIGNED, RETIRED, or TERMINATED" };
    }

    const teacherStatus = finalStatus as TeacherStatus;

    const result = await db.$transaction(async (tx) => {
      const teacher = await tx.teacher.findUnique({
        where: { id: teacherId },
        select: { userId: true, firstName: true, lastName: true, currentStatus: true, staffId: true },
      });

      if (!teacher) throw new Error("Teacher not found");

      await tx.teacher.update({
        where: { id: teacherId },
        data: { currentStatus: teacherStatus, status: teacherStatus, exitDate, exitReason },
      });

      const enrollment = await tx.teacherYearEnrollment.findUnique({
        where: { teacherId_academicYearId: { teacherId, academicYearId } },
      });
      if (enrollment) {
        await tx.teacherYearEnrollment.update({
          where: { teacherId_academicYearId: { teacherId, academicYearId } },
          data: { status: TeacherYearStatus.LEFT_MID_YEAR, endDate: exitDate, exitReason, isActive: false },
        });
      }

      await tx.user.update({ where: { id: teacher.userId }, data: { status: false } });

      // Sync Staff exit if linked
      if (teacher.staffId) {
        const mappedStaffStatus = toStaffStatus(teacherStatus);
        await tx.staff.update({
          where: { id: teacher.staffId },
          data: {
            status:     mappedStaffStatus,
            exitDate,
            exitReason: `${finalStatus} — via Teachers module`,
          },
        });
      }

      // Put StreamSubjectTeacher assignments ON_HOLD
      // (StreamSubjectPaperTeacher removed — paper assignments are now
      //  captured as separate StreamSubjectTeacher rows per paper-scoped StreamSubject)
      const activeAssignments = await tx.streamSubjectTeacher.findMany({
        where: { teacherId, status: AssignmentStatus.ACTIVE },
        include: {
          streamSubject: {
            include: {
              subject: { select: { name: true } },
              
              stream: { include: { classYear: { include: { classTemplate: true } } } },
            },
          },
        },
      });

      await tx.streamSubjectTeacher.updateMany({
        where: { teacherId, status: AssignmentStatus.ACTIVE },
        data: {
          status: AssignmentStatus.ON_HOLD,
          reassignmentNotes: `Teacher ${finalStatus.toLowerCase()} on ${exitDate.toISOString().split("T")[0]}`,
        },
      });

      return {
        teacher,
        assignmentsCount: activeAssignments.length,
        assignments: activeAssignments,
      };
    });

    if (performedById) {
      await logTeacherAction(
        "MARK_AS_LEFT",
        teacherId,
        { currentStatus: result.teacher.currentStatus },
        { finalStatus, exitDate, exitReason, assignmentsAffected: result.assignmentsCount },
        performedById
      );
    }

    revalidatePath("/dashboard/teachers");
    revalidatePath("/dashboard/streams");

    return {
      ok: true,
      data: result,
      message: `${result.teacher?.firstName} ${result.teacher?.lastName} marked as ${finalStatus.toLowerCase()}. ${result.assignmentsCount} assignment(s) need reassignment.`,
    };
  } catch (error: any) {
    console.error("❌ Error marking teacher as left:", error);
    return { ok: false, message: error?.message ?? "Failed to update teacher status" };
  }
}

/** ============================
 * 11. GET TEACHER ASSIGNMENT HISTORY
 *
 * FIX [4]: Removed currentPaperAssignments (streamSubjectPaperTeacher) — model removed.
 * Paper detail is available via streamSubject.subjectPaper on the existing rows.
 * ============================*/

export async function getTeacherAssignmentHistory(teacherId: string) {
  try {
    const currentAssignments = await db.streamSubjectTeacher.findMany({
      where: { teacherId },
      include: {
        streamSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            
            stream: { include: { classYear: { include: { classTemplate: true, academicYear: true } } } },
            term: true,
          },
        },
      },
      orderBy: { assignedDate: "desc" },
    });

    const reassignedFromHistory = await db.streamSubjectTeacherHistory.findMany({
      where: { previousTeacherId: teacherId },
      include: {
        newTeacher: { select: { firstName: true, lastName: true, staffNo: true } },
        streamSubjectTeacher: {
          include: {
            streamSubject: {
              include: {
                subject: { select: { name: true, code: true } },
                
                stream: { include: { classYear: { include: { classTemplate: true, academicYear: true } } } },
                term: true,
              },
            },
          },
        },
      },
      orderBy: { reassignedDate: "desc" },
    });

    const reassignedToHistory = await db.streamSubjectTeacherHistory.findMany({
      where: { newTeacherId: teacherId },
      include: {
        previousTeacher: { select: { firstName: true, lastName: true, staffNo: true } },
        streamSubjectTeacher: {
          include: {
            streamSubject: {
              include: {
                subject: { select: { name: true, code: true } },
                
                stream: { include: { classYear: { include: { classTemplate: true, academicYear: true } } } },
                term: true,
              },
            },
          },
        },
      },
      orderBy: { reassignedDate: "desc" },
    });

    return {
      ok: true,
      data: { current: currentAssignments, reassignedFrom: reassignedFromHistory, reassignedTo: reassignedToHistory },
    };
  } catch (error: any) {
    console.error("❌ Error fetching assignment history:", error);
    return { ok: false, message: error?.message ?? "Failed to fetch history" };
  }
}

/** ============================
 * 12. GET ASSIGNMENTS NEEDING REASSIGNMENT
 *
 * FIX [5]: Removed streamSubjectPaperTeacher section — model removed from schema.
 * All paper-level ON_HOLD assignments are captured in streamSubjectTeacher since
 * each StreamSubject is paper-scoped. subjectPaper include provides paper detail.
 * ============================*/

export async function getAssignmentsNeedingReassignment(schoolId: string) {
  try {
    const subjectAssignments = await db.streamSubjectTeacher.findMany({
      where: { status: AssignmentStatus.ON_HOLD, streamSubject: { stream: { schoolId } } },
      include: {
        teacher: { select: { firstName: true, lastName: true, staffNo: true, exitReason: true, exitDate: true, currentStatus: true } },
        streamSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            
            stream: { include: { classYear: { include: { classTemplate: true, academicYear: true } } } },
            term: true,
            studentEnrollments: {
              select: {
                id: true,
                enrollment: { select: { student: { select: { firstName: true, lastName: true, admissionNo: true } } } },
              },
            },
          },
        },
      },
      orderBy: { assignedDate: "desc" },
    });

    return {
      ok: true,
      data: { subjectAssignments, totalCount: subjectAssignments.length },
    };
  } catch (error: any) {
    console.error("❌ Error fetching assignments needing reassignment:", error);
    return { ok: false, message: error?.message ?? "Failed to fetch assignments" };
  }
}

/** ============================
 * 13. GET CURRENT TEACHER ASSIGNMENTS
 *
 * FIX [6]: Removed paperAssignments (streamSubjectPaperTeacher) from Promise.all.
 * Paper detail is available through streamSubject.subjectPaper on each row.
 * ============================*/

export async function getCurrentTeacherAssignments(teacherId: string, termId?: string) {
  try {
    const whereClause = {
      teacherId,
      status: AssignmentStatus.ACTIVE,
      ...(termId && { streamSubject: { termId } }),
    };

    const assignments = await db.streamSubjectTeacher.findMany({
      where: whereClause,
      include: {
        streamSubject: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            
            stream: { include: { classYear: { include: { classTemplate: true, academicYear: true } } } },
            term: true,
            studentEnrollments: {
              include: {
                enrollment: { include: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } } },
              },
            },
          },
        },
      },
      orderBy: { assignedDate: "desc" },
    });

    return {
      ok: true,
      data: { subjectAssignments: assignments, totalCount: assignments.length },
    };
  } catch (error: any) {
    console.error("❌ Error fetching current assignments:", error);
    return { ok: false, message: error?.message ?? "Failed to fetch assignments" };
  }
}

/** ============================
 * 14. GET TEACHERS BY SCHOOL (Enhanced)
 *
 * FIX [7]: Removed paperTeachingAssignments include — relation removed from schema.
 * ============================*/

export async function getTeachersBySchoolEnhanced(schoolId: string, academicYearId?: string, includeInactive = false) {
  try {
    const teachers = await db.teacher.findMany({
      where: {
        schoolId,
        ...(includeInactive ? {} : { currentStatus: TeacherStatus.ACTIVE }),
      },
      include: {
        user: { select: { id: true, email: true, status: true, isVerfied: true } },
        yearEnrollments: {
          where: academicYearId ? { academicYearId } : undefined,
          include: { academicYear: true },
        },
        streamSubjectAssignments: {
          where: { status: AssignmentStatus.ACTIVE },
          include: {
            streamSubject: {
              include: {
                subject: { select: { id: true, name: true, code: true } },
                
                stream: { include: { classYear: { include: { classTemplate: true } } } },
                term: true,
              },
            },
          },
        },
        headedStreams: { include: { classYear: { include: { classTemplate: true } } } },
        subjectHeadOf: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
    return teachers;
  } catch (error) {
    console.error("❌ Error fetching teachers:", error);
    return [];
  }
}

/** ============================
 * 15. GET TEACHER STATISTICS
 *
 * FIX [8]: Removed totalPaperAssignments and paperAssignmentsNeedingReassignment counts —
 * streamSubjectPaperTeacher model removed from schema.
 * Paper-level assignments are now counted via StreamSubjectTeacher since each
 * StreamSubject is paper-scoped.
 * ============================*/

export async function getTeacherStatistics(schoolId: string, academicYearId?: string) {
  try {
    const [
      totalTeachers, activeTeachers, onLeaveTeachers, totalEnrollments,
      totalAssignments, assignmentsNeedingReassignment,
    ] = await Promise.all([
      db.teacher.count({ where: { schoolId } }),
      db.teacher.count({ where: { schoolId, currentStatus: TeacherStatus.ACTIVE } }),
      db.teacher.count({ where: { schoolId, currentStatus: TeacherStatus.ON_LEAVE } }),
      academicYearId ? db.teacherYearEnrollment.count({ where: { academicYearId, teacher: { schoolId } } }) : 0,
      db.streamSubjectTeacher.count({ where: { teacher: { schoolId }, status: AssignmentStatus.ACTIVE } }),
      db.streamSubjectTeacher.count({ where: { teacher: { schoolId }, status: AssignmentStatus.ON_HOLD } }),
    ]);

    return {
      ok: true,
      data: {
        totalTeachers, activeTeachers, onLeaveTeachers,
        inactiveTeachers: totalTeachers - activeTeachers - onLeaveTeachers,
        totalEnrollments,
        totalAssignments,
        assignmentsNeedingReassignment,
      },
    };
  } catch (error: any) {
    console.error("❌ Error fetching teacher statistics:", error);
    return { ok: false, message: error?.message ?? "Failed to fetch statistics" };
  }
}

/** ============================
 * 16. SEARCH TEACHERS
 * ============================*/

export async function searchTeachers(
  schoolId: string,
  searchTerm: string,
  filters?: { status?: TeacherStatus; specialization?: string; employmentType?: string }
) {
  try {
    const whereClause: Prisma.TeacherWhereInput = {
      schoolId,
      AND: [
        {
          OR: [
            { firstName: { contains: searchTerm, mode: "insensitive" } },
            { lastName: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
            { staffNo: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
      ],
    };

    if (filters?.status)         whereClause.currentStatus = filters.status;
    if (filters?.specialization) whereClause.specialization = { contains: filters.specialization, mode: "insensitive" };
    if (filters?.employmentType) whereClause.employmentType = filters.employmentType;

    const teachers = await db.teacher.findMany({
      where: whereClause,
      include: { user: { select: { id: true, email: true, status: true } } },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 50,
    });

    return { ok: true, data: teachers };
  } catch (error: any) {
    console.error("❌ Error searching teachers:", error);
    return { ok: false, message: error?.message ?? "Failed to search teachers" };
  }
}