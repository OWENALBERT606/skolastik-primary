

// "use server";

// import { db } from "@/prisma/db";
// import { revalidatePath } from "next/cache";

// // ════════════════════════════════════════════════════════════════════════════
// // ASSIGN TEACHER TO STREAM SUBJECT
// // ✅ ENHANCED: Works for both single-paper and multi-paper subjects
// // ════════════════════════════════════════════════════════════════════════════

// export async function assignTeacherToStreamSubject(data: {
//   streamSubjectId: string;
//   teacherId: string;
//   notes?: string;
//   isReassignment?: boolean;
// }) {
//   try {
//     const { streamSubjectId, teacherId, notes, isReassignment } = data;

//     // Check if stream subject exists
//     const streamSubject = await db.streamSubject.findUnique({
//       where: { id: streamSubjectId },
//       include: {
//         subject: {
//           select: {
//             id: true,
//             name: true,
//             code: true,
//           },
//         },
//         subjectPaper: {
//           select: {
//             id: true,
//             paperNumber: true,
//             name: true,
//             paperCode: true, // ✅ Include paper code
//           },
//         },
//         teacherAssignments: {
//           where: { status: "ACTIVE" },
//           include: { teacher: true },
//         },
//         stream: true,
//       },
//     });

//     if (!streamSubject) {
//       return { ok: false, message: "Stream subject not found" };
//     }

//     // Check if teacher exists and is active
//     const teacher = await db.teacher.findUnique({
//       where: { id: teacherId },
//       select: {
//         id: true,
//         currentStatus: true,
//         firstName: true,
//         lastName: true,
//       },
//     });

//     if (!teacher) {
//       return { ok: false, message: "Teacher not found" };
//     }

//     if (teacher.currentStatus !== "ACTIVE") {
//       return { ok: false, message: "Teacher is not active" };
//     }

//     await db.$transaction(async (tx) => {
//       // If reassignment, deactivate current assignment
//       if (isReassignment && streamSubject.teacherAssignments.length > 0) {
//         const currentAssignment = streamSubject.teacherAssignments[0];

//         // Update current assignment status
//         await tx.streamSubjectTeacher.update({
//           where: { id: currentAssignment.id },
//           data: { status: "REASSIGNED" },
//         });

//         // Create history record
//         await tx.streamSubjectTeacherHistory.create({
//           data: {
//             streamSubjectTeacherId: currentAssignment.id,
//             previousTeacherId: currentAssignment.teacher.id,
//             newTeacherId: teacherId,
//             reason: notes || "Teacher reassignment",
//             previousAssignmentStart: currentAssignment.assignedDate,
//             previousAssignmentEnd: new Date(),
//           },
//         });
//       }

//       // Create new assignment
//       await tx.streamSubjectTeacher.create({
//         data: {
//           streamSubjectId,
//           teacherId,
//           status: "ACTIVE",
//           isReassignment: isReassignment || false,
//           reassignmentNotes: notes,
//         },
//       });
//     });

//     revalidatePath(`/dashboard/streams/${streamSubject.stream.id}`);

//     // ✅ Enhanced message with paper info
//     const subjectName = streamSubject.subjectPaper
//       ? `${streamSubject.subject.name} (${streamSubject.subjectPaper.name})`
//       : streamSubject.subject.name;

//     return {
//       ok: true,
//       message: isReassignment
//         ? `Teacher reassigned successfully to ${teacher.firstName} ${teacher.lastName} for ${subjectName}`
//         : `Teacher ${teacher.firstName} ${teacher.lastName} assigned to ${subjectName} successfully`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error assigning teacher:", error);
//     return { ok: false, message: "Failed to assign teacher" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // GET STREAM SUBJECT BY ID
// // ✅ ENHANCED: Includes full paper information and codes
// // ════════════════════════════════════════════════════════════════════════════

// export async function getStreamSubjectById(streamSubjectId: string) {
//   try {
//     if (!streamSubjectId) {
//       return { ok: false, message: "Stream subject ID is required" };
//     }

//     const streamSubject = await db.streamSubject.findUnique({
//       where: { id: streamSubjectId },
//       include: {
//         stream: {
//           include: {
//             classYear: {
//               include: {
//                 classTemplate: true,
//                 academicYear: true,
//               },
//             },
//             school: true,
//           },
//         },
//         subject: {
//           include: {
//             papers: {
//               where: { isActive: true },
//               orderBy: { paperNumber: "asc" },
//               select: {
//                 id: true,
//                 paperNumber: true,
//                 name: true,
//                 paperCode: true, // ✅ Include paper code
//                 maxMarks: true,
//                 weight: true,
//               },
//             },
//           },
//         },
//         classSubject: true,
//         term: {
//           select: {
//             id: true,
//             name: true,
//             termNumber: true,
//           },
//         },
//         subjectPaper: {
//           // ✅ This is the specific paper for this StreamSubject
//           select: {
//             id: true,
//             paperNumber: true,
//             name: true,
//             paperCode: true,
//             maxMarks: true,
//             weight: true,
//           },
//         },
//         // Active teacher assignments
//         teacherAssignments: {
//           where: { status: "ACTIVE" },
//           include: {
//             teacher: {
//               select: {
//                 id: true,
//                 firstName: true,
//                 lastName: true,
//                 staffNo: true,
//                 currentStatus: true,
//                 email: true,
//                 phone: true,
//               },
//             },
//           },
//         },

//         // Paper-specific teachers (if multi-paper)
//         paperTeachers: {
//           where: { status: "ACTIVE" },
//           include: {
//             teacher: {
//               select: {
//                 id: true,
//                 firstName: true,
//                 lastName: true,
//                 staffNo: true,
//                 email: true,
//               },
//             },
//             paper: {
//               select: {
//                 id: true,
//                 paperNumber: true,
//                 name: true,
//                 paperCode: true, // ✅ Include paper code
//               },
//             },
//           },
//         },

//         // Student enrollments with marks
//         studentEnrollments: {
//           include: {
//             enrollment: {
//               select: {
//                 id: true,
//                 student: {
//                   select: {
//                     id: true,
//                     firstName: true,
//                     lastName: true,
//                     admissionNo: true,
//                   },
//                 },
//               },
//             },
//             marks: true,
//             subjectFinalMark: true,
//             subjectResult: true,
//             paperResults: {
//               // ✅ Include paper-specific results
//               include: {
//                 subjectPaper: {
//                   select: {
//                     paperNumber: true,
//                     name: true,
//                     paperCode: true,
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!streamSubject) {
//       return { ok: false, message: "Stream subject not found" };
//     }

//     return {
//       ok: true,
//       data: streamSubject,
//     };
//   } catch (error) {
//     console.error("❌ Error fetching stream subject:", error);
//     return { ok: false, message: "Failed to fetch stream subject" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // ✅ NEW: GET ALL PAPERS FOR A SUBJECT IN A STREAM
// // Useful for displaying all papers of a multi-paper subject together
// // ════════════════════════════════════════════════════════════════════════════

// export async function getStreamSubjectPapers(data: {
//   streamId: string;
//   subjectId: string;
//   termId: string;
// }) {
//   try {
//     const { streamId, subjectId, termId } = data;

//     const streamSubjects = await db.streamSubject.findMany({
//       where: {
//         streamId,
//         subjectId,
//         termId,
//         isActive: true,
//       },
//       include: {
//         subject: {
//           select: {
//             id: true,
//             name: true,
//             code: true,
//           },
//         },
//         subjectPaper: {
//           select: {
//             id: true,
//             paperNumber: true,
//             name: true,
//             paperCode: true,
//             maxMarks: true,
//             weight: true,
//           },
//         },
//         teacherAssignments: {
//           where: { status: "ACTIVE" },
//           include: {
//             teacher: {
//               select: {
//                 id: true,
//                 firstName: true,
//                 lastName: true,
//                 staffNo: true,
//               },
//             },
//           },
//         },
//         _count: {
//           select: {
//             studentEnrollments: true,
//           },
//         },
//       },
//       orderBy: {
//         subjectPaper: {
//           paperNumber: "asc",
//         },
//       },
//     });

//     return {
//       ok: true,
//       data: streamSubjects,
//       isPaperBased: streamSubjects.length > 1,
//       subjectName: streamSubjects[0]?.subject.name,
//     };
//   } catch (error) {
//     console.error("❌ Error fetching stream subject papers:", error);
//     return {
//       ok: false,
//       message: "Failed to fetch stream subject papers",
//       data: [],
//     };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // ✅ NEW: REMOVE TEACHER FROM STREAM SUBJECT
// // ════════════════════════════════════════════════════════════════════════════

// // export async function removeTeacherFromStreamSubject(data: {
// //   assignmentId: string;
// //   reason?: string;
// // }) {
// //   try {
// //     const { assignmentId, reason } = data;

// //     const assignment = await db.streamSubjectTeacher.findUnique({
// //       where: { id: assignmentId },
// //       include: {
// //         teacher: {
// //           select: {
// //             firstName: true,
// //             lastName: true,
// //           },
// //         },
// //         streamSubject: {
// //           include: {
// //             subject: {
// //               select: {
// //                 name: true,
// //               },
// //             },
// //             subjectPaper: {
// //               select: {
// //                 name: true,
// //                 paperCode: true,
// //               },
// //             },
// //             stream: {
// //               select: {
// //                 id: true,
// //               },
// //             },
// //           },
// //         },
// //       },
// //     });

// //     if (!assignment) {
// //       return { ok: false, message: "Assignment not found" };
// //     }

// //     await db.$transaction(async (tx) => {
// //       // Update assignment status
// //       await tx.streamSubjectTeacher.update({
// //         where: { id: assignmentId },
// //         data: { status: "CANCELLED" },
// //       });

// //       // Create history record
// //       await tx.streamSubjectTeacherHistory.create({
// //         data: {
// //           streamSubjectTeacherId: assignmentId,
// //           previousTeacherId: assignment.teacher.id,
// //           newTeacherId: null,
// //           reason: reason || "Teacher removed from subject",
// //           previousAssignmentStart: assignment.assignedDate,
// //           previousAssignmentEnd: new Date(),
// //         },
// //       });
// //     });

// //     revalidatePath(`/school/[slug]/academics/streams/${assignment.streamSubject.stream.id}`, "page");

// //     // ✅ Enhanced message
// //     const subjectName = assignment.streamSubject.subjectPaper
// //       ? `${assignment.streamSubject.subject.name} (${assignment.streamSubject.subjectPaper.name})`
// //       : assignment.streamSubject.subject.name;

// //     return {
// //       ok: true,
// //       message: `${assignment.teacher.firstName} ${assignment.teacher.lastName} removed from ${subjectName}`,
// //     };
// //   } catch (error: any) {
// //     console.error("❌ Error removing teacher:", error);
// //     return { ok: false, message: "Failed to remove teacher" };
// //   }
// // }


// export async function removeTeacherFromStreamSubject(data: {
//   assignmentId: string;
//   reason?: string;
// }) {
//   try {
//     const { assignmentId, reason } = data;

//     const assignment = await db.streamSubjectTeacher.findUnique({
//       where: { id: assignmentId },
//       include: {
//         teacher: {
//           select: {
//             id: true,  // ✅ Add this
//             firstName: true,
//             lastName: true,
//           },
//         },
//         streamSubject: {
//           include: {
//             subject: {
//               select: {
//                 name: true,
//               },
//             },
//             subjectPaper: {
//               select: {
//                 name: true,
//                 paperCode: true,
//               },
//             },
//             stream: {
//               select: {
//                 id: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!assignment) {
//       return { ok: false, message: "Assignment not found" };
//     }

//     await db.$transaction(async (tx) => {
//       // ✅ Update assignment status to REMOVED
//       await tx.streamSubjectTeacher.update({
//         where: { id: assignmentId },
//         data: { status: "REMOVED" },
//       });

//       // ✅ Create history record with null newTeacherId
//       await tx.streamSubjectTeacherHistory.create({
//         data: {
//           streamSubjectTeacherId: assignmentId,
//           previousTeacherId: assignment.teacherId,  // ✅ Use teacherId from assignment
//           newTeacherId: null,  // ✅ null is now allowed
//           reason: reason || "Teacher removed from subject",
//           previousAssignmentStart: assignment.assignedDate,
//           previousAssignmentEnd: new Date(),
//         },
//       });
//     });

//     revalidatePath(`/school/[slug]/academics/streams/${assignment.streamSubject.stream.id}`, "page");

//     const subjectName = assignment.streamSubject.subjectPaper
//       ? `${assignment.streamSubject.subject.name} (${assignment.streamSubject.subjectPaper.name})`
//       : assignment.streamSubject.subject.name;

//     return {
//       ok: true,
//       message: `${assignment.teacher.firstName} ${assignment.teacher.lastName} removed from ${subjectName}`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error removing teacher:", error);
//     return { ok: false, message: "Failed to remove teacher" };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // ✅ NEW: GET TEACHER'S ASSIGNED SUBJECTS
// // Shows all subjects and papers a teacher is assigned to
// // ════════════════════════════════════════════════════════════════════════════

// export async function getTeacherAssignedSubjects(teacherId: string) {
//   try {
//     const assignments = await db.streamSubjectTeacher.findMany({
//       where: {
//         teacherId,
//         status: "ACTIVE",
//       },
//       include: {
//         streamSubject: {
//           include: {
//             subject: {
//               select: {
//                 id: true,
//                 name: true,
//                 code: true,
//               },
//             },
//             subjectPaper: {
//               select: {
//                 id: true,
//                 paperNumber: true,
//                 name: true,
//                 paperCode: true,
//               },
//             },
//             stream: {
//               select: {
//                 id: true,
//                 name: true,
//               },
//             },
//             term: {
//               select: {
//                 id: true,
//                 name: true,
//                 termNumber: true,
//               },
//             },
//             _count: {
//               select: {
//                 studentEnrollments: true,
//               },
//             },
//           },
//         },
//       },
//       orderBy: [
//         { streamSubject: { stream: { name: "asc" } } },
//         { streamSubject: { subject: { name: "asc" } } },
//         { streamSubject: { subjectPaper: { paperNumber: "asc" } } },
//       ],
//     });

//     // ✅ Group by subject to show paper breakdown
//     const grouped = assignments.reduce(
//       (acc, assignment) => {
//         const subjectId = assignment.streamSubject.subject.id;
//         const key = `${subjectId}-${assignment.streamSubject.stream.id}-${assignment.streamSubject.term.id}`;

//         if (!acc[key]) {
//           acc[key] = {
//             subject: assignment.streamSubject.subject,
//             stream: assignment.streamSubject.stream,
//             term: assignment.streamSubject.term,
//             papers: [],
//             totalStudents: 0,
//           };
//         }

//         acc[key].papers.push({
//           paper: assignment.streamSubject.subjectPaper,
//           studentCount: assignment.streamSubject._count.studentEnrollments,
//         });
//         acc[key].totalStudents +=
//           assignment.streamSubject._count.studentEnrollments;

//         return acc;
//       },
//       {} as Record<string, any>
//     );

//     return {
//       ok: true,
//       data: Object.values(grouped),
//       totalAssignments: assignments.length,
//     };
//   } catch (error) {
//     console.error("❌ Error fetching teacher assignments:", error);
//     return {
//       ok: false,
//       message: "Failed to fetch teacher assignments",
//       data: [],
//     };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // ✅ NEW: GET AVAILABLE TEACHERS FOR STREAM SUBJECT
// // Only shows teachers not already assigned to this specific paper
// // ════════════════════════════════════════════════════════════════════════════

// export async function getAvailableTeachersForStreamSubject(data: {
//   streamSubjectId: string;
//   schoolId: string;
// }) {
//   try {
//     const { streamSubjectId, schoolId } = data;

//     // Get already assigned teachers
//     const assigned = await db.streamSubjectTeacher.findMany({
//       where: {
//         streamSubjectId,
//         status: "ACTIVE",
//       },
//       select: {
//         teacherId: true,
//       },
//     });

//     const assignedIds = assigned.map((a) => a.teacherId);

//     // Get all active teachers not yet assigned
//     const teachers = await db.teacher.findMany({
//       where: {
//         schoolId,
//         currentStatus: "ACTIVE",
//         id: {
//           notIn: assignedIds,
//         },
//       },
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         staffNo: true,
//         email: true,
//         phone: true,
//       },
//       orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
//     });

//     return {
//       ok: true,
//       data: teachers,
//     };
//   } catch (error) {
//     console.error("❌ Error fetching available teachers:", error);
//     return {
//       ok: false,
//       message: "Failed to fetch available teachers",
//       data: [],
//     };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // ✅ NEW: GET STREAM SUBJECT STATISTICS
// // ════════════════════════════════════════════════════════════════════════════

// export async function getStreamSubjectStats(streamSubjectId: string) {
//   try {
//     const streamSubject = await db.streamSubject.findUnique({
//       where: { id: streamSubjectId },
//       include: {
//         subject: {
//           select: {
//             name: true,
//             code: true,
//           },
//         },
//         subjectPaper: {
//           select: {
//             name: true,
//             paperCode: true,
//           },
//         },
//         _count: {
//           select: {
//             studentEnrollments: true,
//             teacherAssignments: true,
//           },
//         },
//       },
//     });

//     if (!streamSubject) {
//       return { ok: false, message: "Stream subject not found" };
//     }

//     // Get enrollment statistics
//     const enrollments = await db.studentSubjectEnrollment.findMany({
//       where: {
//         streamSubjectId,
//       },
//       select: {
//         status: true,
//         isCompulsory: true,
//       },
//     });

//     const stats = {
//       total: enrollments.length,
//       active: enrollments.filter((e) => e.status === "ACTIVE").length,
//       dropped: enrollments.filter((e) => e.status === "DROPPED").length,
//       completed: enrollments.filter((e) => e.status === "COMPLETED").length,
//       compulsory: enrollments.filter((e) => e.isCompulsory).length,
//       optional: enrollments.filter((e) => !e.isCompulsory).length,
//       hasTeacher: streamSubject._count.teacherAssignments > 0,
//     };

//     return {
//       ok: true,
//       data: {
//         subject: streamSubject.subject,
//         paper: streamSubject.subjectPaper,
//         stats,
//       },
//     };
//   } catch (error) {
//     console.error("❌ Error fetching stream subject stats:", error);
//     return {
//       ok: false,
//       message: "Failed to fetch statistics",
//     };
//   }
// }



"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";

// ════════════════════════════════════════════════════════════════════════════
// ASSIGN TEACHER TO STREAM SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function assignTeacherToStreamSubject(data: {
  streamSubjectId:  string;
  teacherId:        string;
  notes?:           string;
  isReassignment?:  boolean;
}) {
  try {
    const { streamSubjectId, teacherId, notes, isReassignment } = data;

    const streamSubject = await db.streamSubject.findUnique({
      where: { id: streamSubjectId },
      include: {
        subject:            { select: { id: true, name: true, code: true } },
        teacherAssignments: { where: { status: "ACTIVE" }, include: { teacher: true } },
        stream: true,
      },
    });
    if (!streamSubject) return { ok: false, message: "Stream subject not found" };

    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, currentStatus: true, firstName: true, lastName: true },
    });
    if (!teacher) return { ok: false, message: "Teacher not found" };
    if (teacher.currentStatus !== "ACTIVE") return { ok: false, message: "Teacher is not active" };

    await db.$transaction(async (tx) => {
      if (isReassignment && streamSubject.teacherAssignments.length > 0) {
        const currentAssignment = streamSubject.teacherAssignments[0];
        await tx.streamSubjectTeacher.update({
          where: { id: currentAssignment.id },
          data:  { status: "REASSIGNED" },
        });
        await tx.streamSubjectTeacherHistory.create({
          data: {
            streamSubjectTeacherId:   currentAssignment.id,
            previousTeacherId:        currentAssignment.teacher.id,
            newTeacherId:             teacherId,
            reason:                   notes || "Teacher reassignment",
            previousAssignmentStart:  currentAssignment.assignedDate,
            previousAssignmentEnd:    new Date(),
          },
        });
      }

      await tx.streamSubjectTeacher.create({
        data: {
          streamSubjectId,
          teacherId,
          status:             "ACTIVE",
          isReassignment:     isReassignment || false,
          reassignmentNotes:  notes,
        },
      });
    });

    revalidatePath(`/school/[slug]/academics/streams/${streamSubject.stream.id}`, "page");

    const subjectName = streamSubject.subject.name;

    return {
      ok:      true,
      message: isReassignment
        ? `Teacher reassigned successfully to ${teacher.firstName} ${teacher.lastName} for ${subjectName}`
        : `Teacher ${teacher.firstName} ${teacher.lastName} assigned to ${subjectName} successfully`,
    };
  } catch (error: any) {
    console.error("❌ Error assigning teacher:", error);
    return { ok: false, message: "Failed to assign teacher" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET STREAM SUBJECT BY ID
// ════════════════════════════════════════════════════════════════════════════

export async function getStreamSubjectById(streamSubjectId: string) {
  try {
    if (!streamSubjectId) return { ok: false, message: "Stream subject ID is required" };

    const streamSubject = await db.streamSubject.findUnique({
      where: { id: streamSubjectId },
      include: {
        stream: {
          include: {
            classYear: {
              include: { classTemplate: true, academicYear: true },
            },
            school: true,
          },
        },
        subject: { select: { id: true, name: true, code: true, category: true } },
        classSubject: true,
        term: { select: { id: true, name: true, termNumber: true } },
        teacherAssignments: {
          where: { status: "ACTIVE" },
          include: {
            teacher: {
              select: {
                id: true, firstName: true, lastName: true,
                staffNo: true, currentStatus: true, email: true, phone: true,
              },
            },
          },
        },
        studentEnrollments: {
          include: {
            enrollment: {
              select: {
                id: true,
                student: {
                  select: { id: true, firstName: true, lastName: true, admissionNo: true },
                },
              },
            },
            marks:            true,
            subjectFinalMark: true,
            subjectResult:    true,
          },
        },
      },
    });

    if (!streamSubject) return { ok: false, message: "Stream subject not found" };

    return { ok: true, data: streamSubject };
  } catch (error) {
    console.error("❌ Error fetching stream subject:", error);
    return { ok: false, message: "Failed to fetch stream subject" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET ALL PAPERS FOR A SUBJECT IN A STREAM
// ════════════════════════════════════════════════════════════════════════════

export async function getStreamSubjectPapers(data: {
  streamId:  string;
  subjectId: string;
  termId:    string;
}) {
  try {
    const { streamId, subjectId, termId } = data;

    const streamSubjects = await db.streamSubject.findMany({
      where: { streamId, subjectId, termId, isActive: true },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        teacherAssignments: {
          where: { status: "ACTIVE" },
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true, staffNo: true } },
          },
        },
        _count: { select: { studentEnrollments: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      ok:          true,
      data:        streamSubjects,
      subjectName: streamSubjects[0]?.subject.name,
    };
  } catch (error) {
    console.error("❌ Error fetching stream subjects:", error);
    return { ok: false, message: "Failed to fetch stream subjects", data: [] };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// REMOVE TEACHER FROM STREAM SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function removeTeacherFromStreamSubject(data: {
  assignmentId: string;
  reason?:      string;
}) {
  try {
    const { assignmentId, reason } = data;

    const assignment = await db.streamSubjectTeacher.findUnique({
      where: { id: assignmentId },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        streamSubject: {
          include: {
            subject: { select: { name: true } },
            stream:  { select: { id: true } },
          },
        },
      },
    });
    if (!assignment) return { ok: false, message: "Assignment not found" };

    await db.$transaction(async (tx) => {
      await tx.streamSubjectTeacher.update({
        where: { id: assignmentId },
        data:  { status: "REMOVED" },
      });
      await tx.streamSubjectTeacherHistory.create({
        data: {
          streamSubjectTeacherId:  assignmentId,
          previousTeacherId:       assignment.teacherId,
          newTeacherId:            null,
          reason:                  reason || "Teacher removed from subject",
          previousAssignmentStart: assignment.assignedDate,
          previousAssignmentEnd:   new Date(),
        },
      });
    });

    revalidatePath(`/school/[slug]/academics/streams/${assignment.streamSubject.stream.id}`, "page");

    const subjectName = assignment.streamSubject.subjectPaper
      ? `${assignment.streamSubject.subject.name} (${assignment.streamSubject.subjectPaper.name})`
      : assignment.streamSubject.subject.name;

    return {
      ok:      true,
      message: `${assignment.teacher.firstName} ${assignment.teacher.lastName} removed from ${subjectName}`,
    };
  } catch (error: any) {
    console.error("❌ Error removing teacher:", error);
    return { ok: false, message: "Failed to remove teacher" };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET TEACHER'S ASSIGNED SUBJECTS
// ════════════════════════════════════════════════════════════════════════════

export async function getTeacherAssignedSubjects(teacherId: string) {
  try {
    const assignments = await db.streamSubjectTeacher.findMany({
      where: { teacherId, status: "ACTIVE" },
      include: {
        streamSubject: {
          include: {
            subject:     { select: { id: true, name: true, code: true } },
            subjectPaper: { select: { id: true, paperNumber: true, name: true, paperCode: true } },
            stream:      { select: { id: true, name: true } },
            term:        { select: { id: true, name: true, termNumber: true } },
            _count:      { select: { studentEnrollments: true } },
          },
        },
      },
      // FIX [3]: Removed 3rd orderBy key { streamSubject: { subjectPaper: { paperNumber: "asc" } } }
      // subjectPaperId is nullable — ordering by its field at a top-level findMany orderBy
      // silently excludes rows where the FK is null. The first two keys are safe.
      orderBy: [
        { streamSubject: { stream:  { name: "asc" } } },
        { streamSubject: { subject: { name: "asc" } } },
      ],
    });

    const grouped = assignments.reduce(
      (acc, assignment) => {
        const subjectId = assignment.streamSubject.subject.id;
        const key = `${subjectId}-${assignment.streamSubject.stream.id}-${assignment.streamSubject.term.id}`;

        if (!acc[key]) {
          acc[key] = {
            subject:      assignment.streamSubject.subject,
            stream:       assignment.streamSubject.stream,
            term:         assignment.streamSubject.term,
            papers:       [],
            totalStudents: 0,
          };
        }

        acc[key].papers.push({
          paper:        assignment.streamSubject.subjectPaper,
          studentCount: assignment.streamSubject._count.studentEnrollments,
        });
        acc[key].totalStudents += assignment.streamSubject._count.studentEnrollments;

        return acc;
      },
      {} as Record<string, any>
    );

    return { ok: true, data: Object.values(grouped), totalAssignments: assignments.length };
  } catch (error) {
    console.error("❌ Error fetching teacher assignments:", error);
    return { ok: false, message: "Failed to fetch teacher assignments", data: [] };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET AVAILABLE TEACHERS FOR STREAM SUBJECT
// ════════════════════════════════════════════════════════════════════════════

export async function getAvailableTeachersForStreamSubject(data: {
  streamSubjectId: string;
  schoolId:        string;
}) {
  try {
    const { streamSubjectId, schoolId } = data;

    const assigned = await db.streamSubjectTeacher.findMany({
      where: { streamSubjectId, status: "ACTIVE" },
      select: { teacherId: true },
    });
    const assignedIds = assigned.map((a) => a.teacherId);

    const teachers = await db.teacher.findMany({
      where: { schoolId, currentStatus: "ACTIVE", id: { notIn: assignedIds } },
      select: { id: true, firstName: true, lastName: true, staffNo: true, email: true, phone: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return { ok: true, data: teachers };
  } catch (error) {
    console.error("❌ Error fetching available teachers:", error);
    return { ok: false, message: "Failed to fetch available teachers", data: [] };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GET STREAM SUBJECT STATISTICS
// ════════════════════════════════════════════════════════════════════════════

export async function getStreamSubjectStats(streamSubjectId: string) {
  try {
    const streamSubject = await db.streamSubject.findUnique({
      where: { id: streamSubjectId },
      include: {
        subject:     { select: { name: true, code: true } },
        subjectPaper: { select: { name: true, paperCode: true } },
        _count: { select: { studentEnrollments: true, teacherAssignments: true } },
      },
    });
    if (!streamSubject) return { ok: false, message: "Stream subject not found" };

    const enrollments = await db.studentSubjectEnrollment.findMany({
      where:  { streamSubjectId },
      select: { status: true, isCompulsory: true },
    });

    const stats = {
      total:      enrollments.length,
      active:     enrollments.filter((e) => e.status === "ACTIVE").length,
      dropped:    enrollments.filter((e) => e.status === "DROPPED").length,
      completed:  enrollments.filter((e) => e.status === "COMPLETED").length,
      compulsory: enrollments.filter((e) => e.isCompulsory).length,
      optional:   enrollments.filter((e) => !e.isCompulsory).length,
      hasTeacher: streamSubject._count.teacherAssignments > 0,
    };

    return {
      ok:   true,
      data: { subject: streamSubject.subject, paper: streamSubject.subjectPaper, stats },
    };
  } catch (error) {
    console.error("❌ Error fetching stream subject stats:", error);
    return { ok: false, message: "Failed to fetch statistics" };
  }
}