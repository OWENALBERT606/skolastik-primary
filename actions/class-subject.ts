


// // actions/class-subject.ts
// "use server";

// import { db } from "@/prisma/db";
// import { revalidatePath } from "next/cache";
// import { SubjectType } from "@prisma/client";

// // ═════════════════════════════════════════════════════════════════════════
// // ASSIGN SUBJECT TO CLASS YEAR
// // ═════════════════════════════════════════════════════════════════════════

// export async function assignSubjectToClassYear(data: {
//   classYearId: string;
//   subjectId: string;
//   subjectType?: SubjectType;
// }) {
//   try {
//     const { classYearId, subjectId, subjectType } = data;

//     // ✅ Validate inputs
//     if (!classYearId) {
//       return { ok: false, message: "Class Year ID is required" };
//     }

//     if (!subjectId) {
//       return { ok: false, message: "Subject ID is required" };
//     }

//     // Get the subject with papers
//     const subject = await db.subject.findUnique({
//       where: { id: subjectId },
//       include: {
//         papers: {
//           where: { isActive: true },
//           orderBy: { paperNumber: "asc" },
//           select: {
//             id: true,
//             paperNumber: true,
//             name: true,
//             paperCode: true, // ✅ Include paper code
//             maxMarks: true,
//             weight: true,
//           },
//         },
//       },
//     });

//     if (!subject) {
//       return { ok: false, message: "Subject not found" };
//     }

//     // Check if already assigned
//     const existing = await db.classSubject.findUnique({
//       where: {
//         classYearId_subjectId: {
//           classYearId,
//           subjectId,
//         },
//       },
//     });

//     if (existing) {
//       return {
//         ok: false,
//         message: `${subject.name} is already assigned to this class`,
//       };
//     }

//     // Get class year with streams and terms
//     const classYear = await db.classYear.findUnique({
//       where: { id: classYearId },
//       include: {
//         streams: true,
//         academicYear: {
//           include: {
//             terms: {
//               where: { isActive: true },
//               orderBy: { termNumber: "asc" },
//             },
//           },
//         },
//       },
//     });

//     if (!classYear) {
//       return { ok: false, message: "Class year not found" };
//     }

//     // Use transaction to create class subject and stream subjects
//     const result = await db.$transaction(async (tx) => {
//       // Create class subject
//       const classSubject = await tx.classSubject.create({
//         data: {
//           classYearId,
//           subjectId,
//           subjectType: subjectType || "COMPULSORY",
//           aoiCount: subject.papers.length > 0 ? 0 : 6, // Legacy field
//         },
//       });

//       // Create stream subjects for all streams and terms
//       const streamSubjectData = [];

//       for (const stream of classYear.streams) {
//         for (const term of classYear.academicYear.terms) {
//           if (subject.papers.length > 0) {
//             // ✅ Multi-paper subject: create one StreamSubject per paper
//             for (const paper of subject.papers) {
//               streamSubjectData.push({
//                 streamId: stream.id,
//                 subjectId: subject.id,
//                 classSubjectId: classSubject.id,
//                 termId: term.id,
//                 subjectPaperId: paper.id, // Link to specific paper
//                 subjectType: classSubject.subjectType,
//               });
//             }
//           } else {
//             // ✅ Single-paper subject: create one StreamSubject (no paper link)
//             streamSubjectData.push({
//               streamId: stream.id,
//               subjectId: subject.id,
//               classSubjectId: classSubject.id,
//               termId: term.id,
//               subjectPaperId: null, // No paper for single-paper subjects
//               subjectType: classSubject.subjectType,
//             });
//           }
//         }
//       }

//       if (streamSubjectData.length > 0) {
//         await tx.streamSubject.createMany({
//           data: streamSubjectData,
//           skipDuplicates: true,
//         });
//       }

//       return {
//         classSubject,
//         streamSubjectsCount: streamSubjectData.length,
//         papersCount: subject.papers.length,
//       };
//     });

//     revalidatePath("/dashboard/classes");
//     revalidatePath(`/dashboard/classes/${classYearId}`);

//     // ✅ Enhanced message with paper info
//     const paperInfo =
//       result.papersCount > 0
//         ? ` (${result.papersCount} paper${result.papersCount > 1 ? "s" : ""})`
//         : "";

//     return {
//       ok: true,
//       data: result.classSubject,
//       message: `${subject.name}${paperInfo} assigned successfully to ${classYear.streams.length} stream(s) across ${classYear.academicYear.terms.length} term(s). Created ${result.streamSubjectsCount} stream subject(s).`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error assigning subject:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to assign subject",
//     };
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // BULK ASSIGN SUBJECTS TO CLASS YEAR
// // ═════════════════════════════════════════════════════════════════════════

// export async function bulkAssignSubjectsToClassYear(data: {
//   classYearId: string;
//   subjectIds: string[];
// }) {
//   try {
//     const { classYearId, subjectIds } = data;

//     if (!classYearId) {
//       return { ok: false, message: "Class Year ID is required" };
//     }

//     if (!subjectIds || subjectIds.length === 0) {
//       return { ok: false, message: "Please select at least one subject" };
//     }

//     // Get existing assignments
//     const existing = await db.classSubject.findMany({
//       where: {
//         classYearId,
//         subjectId: { in: subjectIds },
//       },
//       select: { subjectId: true },
//     });

//     const existingSubjectIds = existing.map((e) => e.subjectId);
//     const newSubjectIds = subjectIds.filter(
//       (id) => !existingSubjectIds.includes(id)
//     );

//     if (newSubjectIds.length === 0) {
//       return {
//         ok: false,
//         message: "All selected subjects are already assigned",
//       };
//     }

//     // Get class year with terms and streams
//     const classYear = await db.classYear.findUnique({
//       where: { id: classYearId },
//       include: {
//         streams: true,
//         academicYear: {
//           include: {
//             terms: {
//               where: { isActive: true },
//               orderBy: { termNumber: "asc" },
//             },
//           },
//         },
//       },
//     });

//     if (!classYear) {
//       return { ok: false, message: "Class year not found" };
//     }

//     // Get subject details with papers
//     const subjects = await db.subject.findMany({
//       where: { id: { in: newSubjectIds } },
//       include: {
//         papers: {
//           where: { isActive: true },
//           orderBy: { paperNumber: "asc" },
//           select: {
//             id: true,
//             paperNumber: true,
//             name: true,
//             paperCode: true, // ✅ Include paper code
//           },
//         },
//       },
//     });

//     let totalStreamSubjectsCreated = 0;
//     let totalPapers = 0;

//     // Process each subject
//     await db.$transaction(async (tx) => {
//       for (const subject of subjects) {
//         // Create class subject
//         const classSubject = await tx.classSubject.create({
//           data: {
//             classYearId,
//             subjectId: subject.id,
//             subjectType: "COMPULSORY",
//             aoiCount: subject.papers.length > 0 ? 0 : 6,
//           },
//         });

//         // Create stream subjects for all streams and terms
//         const streamSubjectData = [];

//         for (const stream of classYear.streams) {
//           for (const term of classYear.academicYear.terms) {
//             if (subject.papers.length > 0) {
//               // Multi-paper subject
//               for (const paper of subject.papers) {
//                 streamSubjectData.push({
//                   streamId: stream.id,
//                   subjectId: subject.id,
//                   classSubjectId: classSubject.id,
//                   termId: term.id,
//                   subjectPaperId: paper.id,
//                   subjectType: classSubject.subjectType,
//                 });
//               }
//               totalPapers += subject.papers.length;
//             } else {
//               // Single-paper subject
//               streamSubjectData.push({
//                 streamId: stream.id,
//                 subjectId: subject.id,
//                 classSubjectId: classSubject.id,
//                 termId: term.id,
//                 subjectPaperId: null,
//                 subjectType: classSubject.subjectType,
//               });
//             }
//           }
//         }

//         if (streamSubjectData.length > 0) {
//           await tx.streamSubject.createMany({
//             data: streamSubjectData,
//             skipDuplicates: true,
//           });
//           totalStreamSubjectsCreated += streamSubjectData.length;
//         }
//       }
//     });

//     revalidatePath("/dashboard/classes");
//     revalidatePath(`/dashboard/classes/${classYearId}`);

//     // ✅ Enhanced message with paper count
//     const paperInfo =
//       totalPapers > 0 ? ` including ${totalPapers} total papers` : "";

//     return {
//       ok: true,
//       message: `${newSubjectIds.length} subject(s) assigned successfully${paperInfo}. Created ${totalStreamSubjectsCreated} stream subject(s).`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error bulk assigning subjects:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to assign subjects",
//     };
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // REMOVE SUBJECT FROM CLASS YEAR
// // ═════════════════════════════════════════════════════════════════════════

// export async function removeSubjectFromClassYear(classSubjectId: string) {
//   try {
//     if (!classSubjectId) {
//       return { ok: false, message: "Class subject ID is required" };
//     }

//     // Check for dependencies
//     const classSubject = await db.classSubject.findUnique({
//       where: { id: classSubjectId },
//       include: {
//         subject: {
//           select: {
//             name: true,
//             papers: {
//               where: { isActive: true },
//               select: {
//                 paperNumber: true,
//                 name: true,
//                 paperCode: true, // ✅ Include paper code
//               },
//             },
//           },
//         },
//         streamSubjects: {
//           include: {
//             _count: {
//               select: {
//                 studentEnrollments: true,
//                 teacherAssignments: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!classSubject) {
//       return { ok: false, message: "Class subject not found" };
//     }

//     // Check if any students are enrolled or teachers assigned
//     const hasStudents = classSubject.streamSubjects.some(
//       (ss) => ss._count.studentEnrollments > 0
//     );
//     const hasTeachers = classSubject.streamSubjects.some(
//       (ss) => ss._count.teacherAssignments > 0
//     );

//     if (hasStudents || hasTeachers) {
//       return {
//         ok: false,
//         message: `Cannot remove ${classSubject.subject.name}. ${
//           hasStudents ? "Students are enrolled" : ""
//         }${hasStudents && hasTeachers ? " and " : ""}${
//           hasTeachers ? "teachers are assigned" : ""
//         }.`,
//       };
//     }

//     // Delete class subject (cascade will delete stream subjects)
//     await db.classSubject.delete({
//       where: { id: classSubjectId },
//     });

//     revalidatePath("/dashboard/classes");

//     return {
//       ok: true,
//       message: `${classSubject.subject.name} removed successfully`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error removing subject:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to remove subject",
//     };
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // UPDATE SUBJECT TYPE FOR CLASS
// // ═════════════════════════════════════════════════════════════════════════

// export async function updateClassSubjectType(
//   classSubjectId: string,
//   subjectType: SubjectType
// ) {
//   try {
//     const classSubject = await db.classSubject.update({
//       where: { id: classSubjectId },
//       data: { subjectType },
//     });

//     // Update all stream subjects
//     await db.streamSubject.updateMany({
//       where: { classSubjectId },
//       data: { subjectType },
//     });

//     revalidatePath("/dashboard/classes");

//     return {
//       ok: true,
//       data: classSubject,
//       message: "Subject type updated successfully",
//     };
//   } catch (error: any) {
//     console.error("❌ Error updating subject type:", error);
//     return {
//       ok: false,
//       message: error?.message ?? "Failed to update subject type",
//     };
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // GET AVAILABLE SUBJECTS FOR CLASS YEAR
// // ═════════════════════════════════════════════════════════════════════════

// export async function getAvailableSubjects(
//   schoolId: string,
//   classYearId: string
// ) {
//   try {
//     const subjects = await db.subject.findMany({
//       where: {
//         schoolId,
//         isActive: true,
//       },
//       include: {
//         papers: {
//           where: { isActive: true },
//           select: {
//             id: true,
//             paperNumber: true,
//             name: true,
//             paperCode: true, // ✅ Include paper code
//             maxMarks: true,
//             weight: true,
//           },
//           orderBy: { paperNumber: "asc" },
//         },
//         classSubjects: {
//           where: { classYearId },
//           select: { id: true, subjectType: true },
//         },
//       },
//       orderBy: { name: "asc" },
//     });

//     return subjects.map((subject) => ({
//       id: subject.id,
//       name: subject.name,
//       code: subject.code,
//       papersCount: subject.papers.length,
//       papers: subject.papers,
//       isAssigned: subject.classSubjects.length > 0,
//       assignedSubjectType: subject.classSubjects[0]?.subjectType,
//     }));
//   } catch (error) {
//     console.error("❌ Error fetching available subjects:", error);
//     return [];
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // GET CLASS SUBJECTS WITH STREAM DETAILS
// // ═════════════════════════════════════════════════════════════════════════

// export async function getClassSubjectsWithDetails(classYearId: string) {
//   try {
//     const classSubjects = await db.classSubject.findMany({
//       where: { classYearId },
//       include: {
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
//             headTeacher: {
//               select: {
//                 id: true,
//                 firstName: true,
//                 lastName: true,
//                 staffNo: true,
//               },
//             },
//           },
//         },
//         streamSubjects: {
//           include: {
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
//             subjectPaper: {
//               select: {
//                 id: true,
//                 paperNumber: true,
//                 name: true,
//                 paperCode: true, // ✅ Include paper code
//               },
//             },
//             teacherAssignments: {
//               where: { status: "ACTIVE" },
//               include: {
//                 teacher: {
//                   select: {
//                     id: true,
//                     firstName: true,
//                     lastName: true,
//                     staffNo: true,
//                   },
//                 },
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
//       orderBy: {
//         subject: { name: "asc" },
//       },
//     });

//     return classSubjects;
//   } catch (error) {
//     console.error("❌ Error fetching class subjects:", error);
//     return [];
//   }
// }

// // ═════════════════════════════════════════════════════════════════════════
// // ✅ NEW: GET SUBJECT ASSIGNMENT SUMMARY FOR CLASS YEAR
// // ═════════════════════════════════════════════════════════════════════════

// export async function getClassSubjectAssignmentSummary(classYearId: string) {
//   try {
//     const classSubjects = await db.classSubject.findMany({
//       where: { classYearId },
//       include: {
//         subject: {
//           include: {
//             papers: {
//               where: { isActive: true },
//               select: {
//                 id: true,
//                 paperNumber: true,
//                 name: true,
//                 paperCode: true,
//               },
//             },
//           },
//         },
//         streamSubjects: {
//           select: {
//             id: true,
//             streamId: true,
//             termId: true,
//             subjectPaperId: true,
//           },
//         },
//       },
//     });

//     // Group by subject to show paper breakdown
//     const summary = classSubjects.map((cs) => ({
//       classSubjectId: cs.id,
//       subjectId: cs.subject.id,
//       subjectName: cs.subject.name,
//       subjectCode: cs.subject.code,
//       subjectType: cs.subjectType,
//       papersCount: cs.subject.papers.length,
//       papers: cs.subject.papers.map((p) => ({
//         id: p.id,
//         paperNumber: p.paperNumber,
//         name: p.name,
//         paperCode: p.paperCode,
//       })),
//       streamSubjectsCount: cs.streamSubjects.length,
//       // Group stream subjects by paper
//       streamSubjectsByPaper: cs.subject.papers.reduce(
//         (acc, paper) => {
//           acc[paper.id] = cs.streamSubjects.filter(
//             (ss) => ss.subjectPaperId === paper.id
//           ).length;
//           return acc;
//         },
//         {} as Record<string, number>
//       ),
//     }));

//     return summary;
//   } catch (error) {
//     console.error("❌ Error fetching assignment summary:", error);
//     return [];
//   }
// }



// actions/class-subject.ts
"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
// FIX [1,2]: Import AssignmentStatus for teacherAssignments filter,
// and ensure SubjectType is available for the hardcoded 'COMPULSORY' fix.
import { SubjectType, AssignmentStatus } from "@prisma/client";

// ═════════════════════════════════════════════════════════════════════════
// ASSIGN SUBJECT TO CLASS YEAR
// ═════════════════════════════════════════════════════════════════════════

export async function assignSubjectToClassYear(data: {
  classYearId:  string;
  subjectId:    string;
  subjectType?: SubjectType;
}) {
  try {
    const { classYearId, subjectId, subjectType } = data;

    if (!classYearId) return { ok: false, message: "Class Year ID is required" };
    if (!subjectId)   return { ok: false, message: "Subject ID is required" };

    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      include: {
        papers: {
          where:   { isActive: true },
          orderBy: { paperNumber: "asc" },
          select:  { id: true, paperNumber: true, name: true, paperCode: true },
        },
      },
    });
    if (!subject) return { ok: false, message: "Subject not found" };

    const existing = await db.classSubject.findUnique({
      where: { classYearId_subjectId: { classYearId, subjectId } },
    });
    if (existing) {
      return { ok: false, message: `${subject.name} is already assigned to this class` };
    }

    const classYear = await db.classYear.findUnique({
      where: { id: classYearId },
      include: {
        streams: true,
        academicYear: {
          include: {
            terms: { where: { isActive: true }, orderBy: { termNumber: "asc" } },
          },
        },
      },
    });
    if (!classYear) return { ok: false, message: "Class year not found" };

    if (classYear.academicYear.terms.length === 0) {
      return { ok: false, message: "Academic year must have active terms before assigning subjects" };
    }

    const result = await db.$transaction(async (tx) => {
      const classSubject = await tx.classSubject.create({
        data: {
          classYearId,
          subjectId,
          subjectType: subjectType || SubjectType.COMPULSORY,
          aoiCount:    subject.papers.length > 0 ? 0 : 6,
        },
      });

      const streamSubjectData = [];

      for (const stream of classYear.streams) {
        for (const term of classYear.academicYear.terms) {
          if (subject.papers.length > 0) {
            for (const paper of subject.papers) {
              streamSubjectData.push({
                streamId:       stream.id,
                subjectId:      subject.id,
                classSubjectId: classSubject.id,
                termId:         term.id,
                subjectPaperId: paper.id,
                subjectType:    classSubject.subjectType,
              });
            }
          } else {
            streamSubjectData.push({
              streamId:       stream.id,
              subjectId:      subject.id,
              classSubjectId: classSubject.id,
              termId:         term.id,
              subjectPaperId: null,
              subjectType:    classSubject.subjectType,
            });
          }
        }
      }

      if (streamSubjectData.length > 0) {
        await tx.streamSubject.createMany({ data: streamSubjectData, skipDuplicates: true });
      }

      return {
        classSubject,
        streamSubjectsCount: streamSubjectData.length,
        papersCount:         subject.papers.length,
      };
    });

    revalidatePath("/dashboard/classes");
    revalidatePath(`/dashboard/classes/${classYearId}`);

    const paperInfo =
      result.papersCount > 0
        ? ` (${result.papersCount} paper${result.papersCount > 1 ? "s" : ""})`
        : "";

    return {
      ok:   true,
      data: result.classSubject,
      message: classYear.streams.length > 0
        ? `${subject.name}${paperInfo} assigned successfully to ${classYear.streams.length} stream(s) across ${classYear.academicYear.terms.length} term(s). Created ${result.streamSubjectsCount} stream subject(s).`
        : `${subject.name}${paperInfo} assigned successfully. Note: No streams exist yet. Stream subjects will be created when streams are added.`,
    };
  } catch (error: any) {
    console.error("❌ Error assigning subject:", error);
    return { ok: false, message: error?.message ?? "Failed to assign subject" };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// BULK ASSIGN SUBJECTS TO CLASS YEAR
// ═════════════════════════════════════════════════════════════════════════

export async function bulkAssignSubjectsToClassYear(data: {
  classYearId: string;
  subjectIds:  string[];
}) {
  try {
    const { classYearId, subjectIds } = data;

    if (!classYearId) return { ok: false, message: "Class Year ID is required" };
    if (!subjectIds || subjectIds.length === 0) {
      return { ok: false, message: "Please select at least one subject" };
    }

    const existing = await db.classSubject.findMany({
      where:  { classYearId, subjectId: { in: subjectIds } },
      select: { subjectId: true },
    });
    const existingSubjectIds = existing.map(e => e.subjectId);
    const newSubjectIds      = subjectIds.filter(id => !existingSubjectIds.includes(id));

    if (newSubjectIds.length === 0) {
      return { ok: false, message: "All selected subjects are already assigned" };
    }

    const classYear = await db.classYear.findUnique({
      where: { id: classYearId },
      include: {
        streams: true,
        academicYear: {
          include: {
            terms: { where: { isActive: true }, orderBy: { termNumber: "asc" } },
          },
        },
      },
    });
    if (!classYear) return { ok: false, message: "Class year not found" };

    if (classYear.academicYear.terms.length === 0) {
      return { ok: false, message: "Academic year must have active terms before assigning subjects" };
    }

    const subjects = await db.subject.findMany({
      where: { id: { in: newSubjectIds } },
      include: {
        papers: {
          where:   { isActive: true },
          orderBy: { paperNumber: "asc" },
          select:  { id: true, paperNumber: true, name: true, paperCode: true },
        },
      },
    });

    let totalStreamSubjectsCreated = 0;
    let totalPapers                = 0;

    await db.$transaction(async (tx) => {
      for (const subject of subjects) {
        const classSubject = await tx.classSubject.create({
          data: {
            classYearId,
            subjectId:   subject.id,
            // FIX [2]: SubjectType enum instead of string literal
            subjectType: SubjectType.COMPULSORY,
            aoiCount:    subject.papers.length > 0 ? 0 : 6,
          },
        });

        const streamSubjectData = [];

        for (const stream of classYear.streams) {
          for (const term of classYear.academicYear.terms) {
            if (subject.papers.length > 0) {
              for (const paper of subject.papers) {
                streamSubjectData.push({
                  streamId:       stream.id,
                  subjectId:      subject.id,
                  classSubjectId: classSubject.id,
                  termId:         term.id,
                  subjectPaperId: paper.id,
                  subjectType:    classSubject.subjectType,
                });
              }
              totalPapers += subject.papers.length;
            } else {
              streamSubjectData.push({
                streamId:       stream.id,
                subjectId:      subject.id,
                classSubjectId: classSubject.id,
                termId:         term.id,
                subjectPaperId: null,
                subjectType:    classSubject.subjectType,
              });
            }
          }
        }

        if (streamSubjectData.length > 0) {
          await tx.streamSubject.createMany({ data: streamSubjectData, skipDuplicates: true });
          totalStreamSubjectsCreated += streamSubjectData.length;
        }
      }
    });

    revalidatePath("/dashboard/classes");
    revalidatePath(`/dashboard/classes/${classYearId}`);

    const paperInfo = totalPapers > 0 ? ` including ${totalPapers} total papers` : "";

    return {
      ok:      true,
      message: classYear.streams.length > 0
        ? `${newSubjectIds.length} subject(s) assigned successfully${paperInfo}. Created ${totalStreamSubjectsCreated} stream subject(s) across ${classYear.streams.length} stream(s).`
        : `${newSubjectIds.length} subject(s) assigned successfully${paperInfo}. Note: No streams exist yet. Stream subjects will be created when streams are added.`,
    };
  } catch (error: any) {
    console.error("❌ Error bulk assigning subjects:", error);
    return { ok: false, message: error?.message ?? "Failed to assign subjects" };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// REMOVE SUBJECT FROM CLASS YEAR
// ═════════════════════════════════════════════════════════════════════════

export async function removeSubjectFromClassYear(classSubjectId: string) {
  try {
    if (!classSubjectId) return { ok: false, message: "Class subject ID is required" };

    const classSubject = await db.classSubject.findUnique({
      where: { id: classSubjectId },
      include: {
        subject: {
          select: {
            name:   true,
            papers: { where: { isActive: true }, select: { paperCode: true, name: true } },
          },
        },
        streamSubjects: {
          include: {
            _count: { select: { studentEnrollments: true, teacherAssignments: true } },
          },
        },
      },
    });
    if (!classSubject) return { ok: false, message: "Class subject not found" };

    const hasStudents = classSubject.streamSubjects.some(ss => ss._count.studentEnrollments > 0);
    const hasTeachers = classSubject.streamSubjects.some(ss => ss._count.teacherAssignments > 0);

    if (hasStudents || hasTeachers) {
      return {
        ok:      false,
        message: `Cannot remove ${classSubject.subject.name}. ${
          hasStudents ? "Students are enrolled" : ""
        }${hasStudents && hasTeachers ? " and " : ""}${
          hasTeachers ? "teachers are assigned" : ""
        }.`,
      };
    }

    await db.classSubject.delete({ where: { id: classSubjectId } });
    revalidatePath("/dashboard/classes");

    return { ok: true, message: `${classSubject.subject.name} removed successfully` };
  } catch (error: any) {
    console.error("❌ Error removing subject:", error);
    return { ok: false, message: error?.message ?? "Failed to remove subject" };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// UPDATE SUBJECT TYPE FOR CLASS
// ═════════════════════════════════════════════════════════════════════════

export async function updateClassSubjectType(
  classSubjectId: string,
  subjectType:    SubjectType
) {
  try {
    const classSubject = await db.classSubject.update({
      where: { id: classSubjectId },
      data:  { subjectType },
    });

    await db.streamSubject.updateMany({
      where: { classSubjectId },
      data:  { subjectType },
    });

    revalidatePath("/dashboard/classes");
    return { ok: true, data: classSubject, message: "Subject type updated successfully" };
  } catch (error: any) {
    console.error("❌ Error updating subject type:", error);
    return { ok: false, message: error?.message ?? "Failed to update subject type" };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// GET AVAILABLE SUBJECTS FOR CLASS YEAR
// ═════════════════════════════════════════════════════════════════════════

export async function getAvailableSubjects(schoolId: string, classYearId: string) {
  try {
    const subjects = await db.subject.findMany({
      where: { schoolId, isActive: true },
      include: {
        papers: {
          where:   { isActive: true },
          select:  { id: true, paperNumber: true, name: true, paperCode: true },
          orderBy: { paperNumber: "asc" },
        },
        classSubjects: {
          where:  { classYearId },
          select: { id: true, subjectType: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return subjects.map(subject => ({
      id:                  subject.id,
      name:                subject.name,
      code:                subject.code,
      papersCount:         subject.papers.length,
      papers:              subject.papers,
      isAssigned:          subject.classSubjects.length > 0,
      assignedSubjectType: subject.classSubjects[0]?.subjectType,
    }));
  } catch (error) {
    console.error("❌ Error fetching available subjects:", error);
    return [];
  }
}

// ═════════════════════════════════════════════════════════════════════════
// GET CLASS SUBJECTS WITH STREAM DETAILS
// ═════════════════════════════════════════════════════════════════════════

export async function getClassSubjectsWithDetails(classYearId: string) {
  try {
    const classSubjects = await db.classSubject.findMany({
      where: { classYearId },
      include: {
        subject: {
          include: {
            papers: {
              where:   { isActive: true },
              orderBy: { paperNumber: "asc" },
              select:  { id: true, paperNumber: true, name: true, paperCode: true },
            },
            headTeacher: {
              select: { id: true, firstName: true, lastName: true, staffNo: true },
            },
          },
        },
        streamSubjects: {
          include: {
            stream:      { select: { id: true, name: true } },
            term:        { select: { id: true, name: true, termNumber: true } },
            subjectPaper: { select: { id: true, paperNumber: true, name: true, paperCode: true } },
            teacherAssignments: {
              // FIX [1]: Use AssignmentStatus enum
              where: { status: AssignmentStatus.ACTIVE },
              include: {
                teacher: { select: { id: true, firstName: true, lastName: true, staffNo: true } },
              },
            },
            _count: { select: { studentEnrollments: true } },
          },
        },
      },
      orderBy: { subject: { name: "asc" } },
    });

    return classSubjects;
  } catch (error) {
    console.error("❌ Error fetching class subjects:", error);
    return [];
  }
}

// ═════════════════════════════════════════════════════════════════════════
// GET SUBJECT ASSIGNMENT SUMMARY FOR CLASS YEAR
// (from doc 26 — not present in doc 27, retained here)
// ═════════════════════════════════════════════════════════════════════════

export async function getClassSubjectAssignmentSummary(classYearId: string) {
  try {
    const classSubjects = await db.classSubject.findMany({
      where: { classYearId },
      include: {
        subject: {
          include: {
            papers: {
              where:  { isActive: true },
              select: { id: true, paperNumber: true, name: true, paperCode: true },
            },
          },
        },
        streamSubjects: {
          select: { id: true, streamId: true, termId: true, subjectPaperId: true },
        },
      },
    });

    return classSubjects.map(cs => ({
      classSubjectId:      cs.id,
      subjectId:           cs.subject.id,
      subjectName:         cs.subject.name,
      subjectCode:         cs.subject.code,
      subjectType:         cs.subjectType,
      papersCount:         cs.subject.papers.length,
      papers:              cs.subject.papers.map(p => ({
        id: p.id, paperNumber: p.paperNumber, name: p.name, paperCode: p.paperCode,
      })),
      streamSubjectsCount: cs.streamSubjects.length,
      streamSubjectsByPaper: cs.subject.papers.reduce(
        (acc, paper) => {
          acc[paper.id] = cs.streamSubjects.filter(ss => ss.subjectPaperId === paper.id).length;
          return acc;
        },
        {} as Record<string, number>
      ),
    }));
  } catch (error) {
    console.error("❌ Error fetching assignment summary:", error);
    return [];
  }
}