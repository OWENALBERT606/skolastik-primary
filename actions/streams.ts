"use server";

import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

/* ─────────────────────────────────────────────────────────────
 TYPES
───────────────────────────────────────────────────────────── */

type CreateStreamPayload = {
  name:        string;
  classYearId: string;
  schoolId:    string;
  classHeadId?: string | null;
};

type UpdateStreamData = {
  name?:        string;
  classHeadId?: string | null;
  // FIX [4]: Removed capacity and description — Stream model has no such fields in schema
  isActive?: boolean;
};

/* ─────────────────────────────────────────────────────────────
 CREATE STREAM
───────────────────────────────────────────────────────────── */

export async function createStream(data: CreateStreamPayload) {
  try {
    const { name, classYearId, schoolId, classHeadId } = data;

    if (!name?.trim()) {
      return { ok: false, message: "Stream name is required" };
    }

    const existing = await db.stream.findFirst({
      where: {
        classYearId,
        name: { equals: name.trim(), mode: Prisma.QueryMode.insensitive },
      },
    });
    if (existing) {
      return { ok: false, message: "A stream with this name already exists in this class" };
    }

    if (classHeadId) {
      const teacher = await db.teacher.findUnique({
        where: { id: classHeadId },
        select: {
          id: true, currentStatus: true,
          headedStreams: { where: { classYearId } },
        },
      });
      if (!teacher) return { ok: false, message: "Teacher not found" };
      if (teacher.currentStatus !== "ACTIVE") return { ok: false, message: "Teacher is not active" };
      if (teacher.headedStreams.length > 0) {
        return { ok: false, message: "Teacher is already a class head for another stream in this class" };
      }
    }

    const classYear = await db.classYear.findUnique({
      where: { id: classYearId },
      include: {
        academicYear: {
          include: {
            terms: { where: { isActive: true }, orderBy: { termNumber: "asc" } },
          },
        },
        classSubjects: {
          include: {
            subject: {
              include: {
                papers: {
                  where: { isActive: true },
                  orderBy: { paperNumber: "asc" },
                  select: { id: true, paperNumber: true, name: true, paperCode: true },
                },
              },
            },
          },
        },
      },
    });

    if (!classYear) return { ok: false, message: "Class year not found" };
    if (classYear.academicYear.terms.length === 0) {
      return { ok: false, message: "Academic year must have active terms before creating streams" };
    }

    const result = await db.$transaction(async (tx) => {
      const stream = await tx.stream.create({
        data: {
          name: name.trim(),
          classYearId, schoolId,
          ...(classHeadId && { classHeadId }),
        },
        include: {
          classHead: { select: { id: true, firstName: true, lastName: true, staffNo: true } },
        },
      });

      const streamSubjectData: Prisma.StreamSubjectCreateManyInput[] = [];

      for (const classSubject of classYear.classSubjects) {
        const subject = classSubject.subject;
        for (const term of classYear.academicYear.terms) {
          if (subject.papers.length > 0) {
            for (const paper of subject.papers) {
              streamSubjectData.push({
                streamId: stream.id, subjectId: subject.id,
                classSubjectId: classSubject.id, termId: term.id,
                subjectPaperId: paper.id, subjectType: classSubject.subjectType,
              });
            }
          } else {
            streamSubjectData.push({
              streamId: stream.id, subjectId: subject.id,
              classSubjectId: classSubject.id, termId: term.id,
              subjectPaperId: null, subjectType: classSubject.subjectType,
            });
          }
        }
      }

      if (streamSubjectData.length > 0) {
        await tx.streamSubject.createMany({ data: streamSubjectData, skipDuplicates: true });
      }

      const uniqueSubjects = new Set(classYear.classSubjects.map((cs) => cs.subject.id));
      return { stream, streamSubjectsCount: streamSubjectData.length, uniqueSubjectsCount: uniqueSubjects.size };
    });

    revalidatePath("/dashboard/classes");
    revalidatePath(`/dashboard/classes/${classYearId}`);

    const paperInfo =
      result.streamSubjectsCount > result.uniqueSubjectsCount
        ? ` (${result.uniqueSubjectsCount} subjects, ${result.streamSubjectsCount} total papers)`
        : ` (${result.uniqueSubjectsCount} subjects)`;

    return {
      ok:      true,
      data:    result.stream,
      message: `Stream "${result.stream.name}" created with ${result.streamSubjectsCount} subject assignment(s)${paperInfo}`,
    };
  } catch (error: any) {
    console.error("❌ Error creating stream:", error);
    return { ok: false, message: error?.message ?? "Failed to create stream" };
  }
}

/* ─────────────────────────────────────────────────────────────
 BULK CREATE STREAMS
───────────────────────────────────────────────────────────── */

export async function bulkCreateStreams(data: {
  names:       string[];
  classYearId: string;
  schoolId:    string;
}) {
  try {
    const { names, classYearId, schoolId } = data;

    if (!names || names.length === 0) {
      return { ok: false, message: "At least one stream name is required" };
    }

    const existingStreams = await db.stream.findMany({
      where: { classYearId }, select: { name: true },
    });
    const existingNames = new Set(existingStreams.map((s) => s.name.toLowerCase()));
    const uniqueNames = names.map((n) => n.trim()).filter((n) => n && !existingNames.has(n.toLowerCase()));

    if (uniqueNames.length === 0) {
      return { ok: false, message: "All stream names already exist or are invalid" };
    }

    const classYear = await db.classYear.findUnique({
      where: { id: classYearId },
      include: {
        academicYear: {
          include: {
            terms: { where: { isActive: true }, orderBy: { termNumber: "asc" } },
          },
        },
        classSubjects: {
          include: {
            subject: {
              include: {
                papers: {
                  where: { isActive: true },
                  orderBy: { paperNumber: "asc" },
                  select: { id: true, paperNumber: true, name: true, paperCode: true },
                },
              },
            },
          },
        },
      },
    });

    if (!classYear) return { ok: false, message: "Class year not found" };
    if (classYear.academicYear.terms.length === 0) {
      return { ok: false, message: "Academic year must have active terms before creating streams" };
    }

    const result = await db.$transaction(async (tx) => {
      const createdStreams = [];
      let totalStreamSubjects = 0;

      for (const name of uniqueNames) {
        const stream = await tx.stream.create({ data: { name, classYearId, schoolId } });
        createdStreams.push(stream);

        const streamSubjectData: Prisma.StreamSubjectCreateManyInput[] = [];

        for (const classSubject of classYear.classSubjects) {
          const subject = classSubject.subject;
          for (const term of classYear.academicYear.terms) {
            if (subject.papers.length > 0) {
              for (const paper of subject.papers) {
                streamSubjectData.push({
                  streamId: stream.id, subjectId: subject.id,
                  classSubjectId: classSubject.id, termId: term.id,
                  subjectPaperId: paper.id, subjectType: classSubject.subjectType,
                });
              }
            } else {
              streamSubjectData.push({
                streamId: stream.id, subjectId: subject.id,
                classSubjectId: classSubject.id, termId: term.id,
                subjectPaperId: null, subjectType: classSubject.subjectType,
              });
            }
          }
        }

        if (streamSubjectData.length > 0) {
          await tx.streamSubject.createMany({ data: streamSubjectData, skipDuplicates: true });
          totalStreamSubjects += streamSubjectData.length;
        }
      }

      return { createdStreams, totalStreamSubjects };
    });

    revalidatePath("/dashboard/classes");
    revalidatePath(`/dashboard/classes/${classYearId}`);

    return {
      ok:      true,
      message: `${result.createdStreams.length} stream(s) created with ${result.totalStreamSubjects} total subject assignment(s)`,
      count:   result.createdStreams.length,
    };
  } catch (error: any) {
    console.error("❌ Error bulk creating streams:", error);
    return { ok: false, message: error?.message ?? "Failed to create streams" };
  }
}

/* ─────────────────────────────────────────────────────────────
 UPDATE STREAM
───────────────────────────────────────────────────────────── */

export async function updateStream(id: string, data: UpdateStreamData) {
  try {
    const stream = await db.stream.findUnique({
      where: { id },
      select: { classYearId: true, classHeadId: true },
    });
    if (!stream) return { ok: false, message: "Stream not found" };

    if (data.name?.trim()) {
      const duplicate = await db.stream.findFirst({
        where: {
          classYearId: stream.classYearId,
          name: { equals: data.name.trim(), mode: Prisma.QueryMode.insensitive },
          NOT: { id },
        },
      });
      if (duplicate) return { ok: false, message: "A stream with this name already exists in this class" };
    }

    if (data.classHeadId && data.classHeadId !== stream.classHeadId) {
      const teacher = await db.teacher.findUnique({
        where: { id: data.classHeadId },
        select: {
          id: true, currentStatus: true,
          headedStreams: { where: { classYearId: stream.classYearId } },
        },
      });
      if (!teacher) return { ok: false, message: "Teacher not found" };
      if (teacher.currentStatus !== "ACTIVE") return { ok: false, message: "Teacher is not active" };
      if (teacher.headedStreams.length > 0) {
        return { ok: false, message: "Teacher is already a class head for another stream in this class" };
      }
    }

    // FIX [4]: Only include fields that actually exist on the Stream model
    const updateData: Prisma.StreamUpdateInput = {
      ...(data.name     !== undefined && { name:     data.name.trim() }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };

    if (data.classHeadId === null) {
      updateData.classHead = { disconnect: true };
    } else if (data.classHeadId) {
      updateData.classHead = { connect: { id: data.classHeadId } };
    }

    const updatedStream = await db.stream.update({
      where: { id },
      data:  updateData,
      include: {
        classHead: { select: { id: true, firstName: true, lastName: true, staffNo: true } },
      },
    });

    revalidatePath("/dashboard/classes");
    revalidatePath(`/dashboard/classes/${stream.classYearId}`);
    revalidatePath(`/dashboard/streams/${id}`);

    return { ok: true, data: updatedStream, message: "Stream updated successfully" };
  } catch (error: any) {
    console.error("❌ Error updating stream:", error);
    return { ok: false, message: error?.message ?? "Failed to update stream" };
  }
}

/* ─────────────────────────────────────────────────────────────
 DELETE STREAM
───────────────────────────────────────────────────────────── */

export async function deleteStream(id: string) {
  try {
    const stream = await db.stream.findUnique({
      where: { id },
      include: {
        _count: { select: { enrollments: true, streamSubjects: true } },
      },
    });
    if (!stream) return { ok: false, message: "Stream not found" };
    if (stream._count.enrollments > 0) {
      return {
        ok: false,
        message: `Cannot delete stream. It has ${stream._count.enrollments} enrolled student(s).`,
      };
    }

    const streamSubjectsWithData = await db.streamSubject.findMany({
      where: { streamId: id },
      include: {
        _count: {
          select: {
            teacherAssignments: true,
            // FIX [1]: Removed paperTeachers — StreamSubjectPaperTeacher model removed.
            // Teacher assignment per paper is now via StreamSubjectTeacher on the
            // paper-scoped StreamSubject row directly.
            studentEnrollments: true,
          },
        },
      },
    });

    const hasTeachers = streamSubjectsWithData.some(
      (ss) => ss._count.teacherAssignments > 0
    );
    const hasStudentEnrollments = streamSubjectsWithData.some(
      (ss) => ss._count.studentEnrollments > 0
    );

    if (hasTeachers) {
      return { ok: false, message: "Cannot delete stream. It has teacher assignment(s). Remove them first." };
    }
    if (hasStudentEnrollments) {
      return { ok: false, message: "Cannot delete stream. It has student subject enrollment(s). Remove them first." };
    }

    await db.stream.delete({ where: { id } });

    revalidatePath("/dashboard/classes");
    revalidatePath(`/dashboard/classes/${stream.classYearId}`);

    return { ok: true, message: `Stream "${stream.name}" deleted successfully` };
  } catch (error: any) {
    console.error("❌ Error deleting stream:", error);
    return { ok: false, message: error?.message ?? "Failed to delete stream" };
  }
}

/* ─────────────────────────────────────────────────────────────
 QUERIES
───────────────────────────────────────────────────────────── */

export async function getStreamById(id: string) {
  try {
    const stream = await db.stream.findUnique({
      where: { id },
      include: {
        classYear: {
          include: {
            classTemplate: true,
            academicYear: {
              include: { terms: { orderBy: { termNumber: "asc" } } },
            },
          },
        },
        classHead: {
          select: { id: true, firstName: true, lastName: true, staffNo: true, email: true, phone: true },
        },
        streamSubjects: {
          include: {
            subject: { select: { id: true, name: true, code: true, category: true } },
            term: true,
            teacherAssignments: {
              where: { status: "ACTIVE" },
              include: {
                teacher: { select: { id: true, firstName: true, lastName: true, staffNo: true } },
              },
            },
            _count: { select: { studentEnrollments: true } },
          },
          orderBy: [
            { term:    { termNumber: "asc" } },
            { subject: { name:       "asc" } },
          ],
        },
        enrollments: {
          where: { status: { in: ["ACTIVE", "TRANSFERRED"] } },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, admissionNo: true, gender: true, otherNames: true },
            },
            term: true,
          },
          orderBy: { student: { firstName: "asc" } },
        },
        _count: { select: { enrollments: true } },
      },
    });

    return stream;
  } catch (error) {
    console.error("❌ Error fetching stream:", error);
    return null;
  }
}

export async function getStreamsByClassYear(classYearId: string) {
  try {
    const streams = await db.stream.findMany({
      where: { classYearId },
      include: {
        classHead: { select: { id: true, firstName: true, lastName: true, staffNo: true } },
        _count: { select: { enrollments: true, streamSubjects: true } },
      },
      orderBy: { name: "asc" },
    });
    return streams;
  } catch (error) {
    console.error("❌ Error fetching streams:", error);
    return [];
  }
}

export async function getAvailableClassHeads(
  schoolId:      string,
  classYearId:   string,
  excludeStreamId?: string
) {
  return db.teacher.findMany({
    where: {
      schoolId,
      currentStatus: "ACTIVE",
      OR: [
        { headedStreams: { none: {} } },
        ...(excludeStreamId
          ? [{ headedStreams: { some: { id: excludeStreamId, classYearId } } }]
          : []),
      ],
    },
    select: { id: true, firstName: true, lastName: true, staffNo: true, email: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
}

/* ─────────────────────────────────────────────────────────────
 SYNC STREAM SUBJECTS
───────────────────────────────────────────────────────────── */

export async function syncStreamSubjects(streamId: string) {
  try {
    const stream = await db.stream.findUnique({
      where: { id: streamId },
      include: {
        classYear: {
          include: {
            academicYear: {
              include: {
                terms: { where: { isActive: true }, orderBy: { termNumber: "asc" } },
              },
            },
            classSubjects: {
              include: {
                subject: {
                  include: {
                    papers: {
                      where: { isActive: true },
                      orderBy: { paperNumber: "asc" },
                      select: { id: true, paperNumber: true, name: true, paperCode: true },
                    },
                  },
                },
              },
            },
          },
        },
        streamSubjects: {
          select: { subjectId: true, termId: true, subjectPaperId: true },
        },
      },
    });
    if (!stream) return { ok: false, message: "Stream not found" };

    const existingCombinations = new Set(
      stream.streamSubjects.map((ss) =>
        ss.subjectPaperId
          ? `${ss.subjectId}-${ss.termId}-${ss.subjectPaperId}`
          : `${ss.subjectId}-${ss.termId}`
      )
    );

    const missingStreamSubjects: Prisma.StreamSubjectCreateManyInput[] = [];

    for (const classSubject of stream.classYear.classSubjects) {
      const subject = classSubject.subject;
      for (const term of stream.classYear.academicYear.terms) {
        if (subject.papers.length > 0) {
          for (const paper of subject.papers) {
            const key = `${subject.id}-${term.id}-${paper.id}`;
            if (!existingCombinations.has(key)) {
              missingStreamSubjects.push({
                streamId: stream.id, subjectId: subject.id,
                classSubjectId: classSubject.id, termId: term.id,
                subjectPaperId: paper.id, subjectType: classSubject.subjectType,
              });
            }
          }
        } else {
          const key = `${subject.id}-${term.id}`;
          if (!existingCombinations.has(key)) {
            missingStreamSubjects.push({
              streamId: stream.id, subjectId: subject.id,
              classSubjectId: classSubject.id, termId: term.id,
              subjectPaperId: null, subjectType: classSubject.subjectType,
            });
          }
        }
      }
    }

    if (missingStreamSubjects.length === 0) {
      return { ok: true, message: "Stream subjects are already in sync" };
    }

    await db.streamSubject.createMany({ data: missingStreamSubjects, skipDuplicates: true });

    revalidatePath("/dashboard/streams");
    revalidatePath(`/dashboard/streams/${streamId}`);

    return { ok: true, message: `Added ${missingStreamSubjects.length} missing stream subject(s)` };
  } catch (error: any) {
    console.error("❌ Error syncing stream subjects:", error);
    return { ok: false, message: error?.message ?? "Failed to sync stream subjects" };
  }
}

export async function getStreamStats(classYearId: string) {
  const totalStreams = await db.stream.count({ where: { classYearId } });
  const streamsWithHeads = await db.stream.count({
    where: { classYearId, classHeadId: { not: null } },
  });
  const totalEnrollments = await db.enrollment.count({
    where: { classYearId, status: "ACTIVE" },
  });
  const streamEnrollmentCounts = await db.stream.findMany({
    where: { classYearId },
    select: { id: true, name: true, _count: { select: { enrollments: true } } },
  });

  return {
    totalStreams,
    streamsWithHeads,
    streamsWithoutHeads: totalStreams - streamsWithHeads,
    totalEnrollments,
    streamEnrollmentCounts,
  };
}

export async function getStreamsByAcademicYear(schoolId: string, academicYearId: string) {
  try {
    const streams = await db.stream.findMany({
      where: { schoolId, classYear: { academicYearId } },
      include: {
        classYear: { include: { classTemplate: true, academicYear: true } },
        classHead: { select: { id: true, firstName: true, lastName: true, staffNo: true } },
        _count: { select: { enrollments: true, streamSubjects: true } },
      },
      orderBy: [
        { classYear: { classTemplate: { name: "asc" } } },
        { name: "asc" },
      ],
    });
    return streams;
  } catch (error) {
    console.error("❌ Error fetching streams by year:", error);
    return [];
  }
}

export async function getStreamsBySchool(schoolId: string) {
  try {
    const streams = await db.stream.findMany({
      where: { schoolId },
      include: {
        classYear: { include: { classTemplate: true, academicYear: true } },
        classHead: { select: { id: true, firstName: true, lastName: true, staffNo: true } },
        _count: { select: { enrollments: true, streamSubjects: true } },
      },
      orderBy: [
        { classYear: { academicYear: { year: "desc" } } },
        { classYear: { classTemplate: { name: "asc" } } },
        { name: "asc" },
      ],
    });
    return streams;
  } catch (error) {
    console.error("❌ Error fetching streams:", error);
    return [];
  }
}

export async function getStreamsBySchoolActiveYear(schoolId: string) {
  try {
    const streams = await db.stream.findMany({
      where: { schoolId, classYear: { academicYear: { schoolId, isActive: true } } },
      include: {
        classYear: { include: { classTemplate: true, academicYear: true } },
        classHead: { select: { id: true, firstName: true, lastName: true, staffNo: true } },
        _count: { select: { enrollments: true, streamSubjects: true } },
      },
      orderBy: [
        { classYear: { classTemplate: { name: "asc" } } },
        { name: "asc" },
      ],
    });
    return streams;
  } catch (error) {
    console.error("❌ Error fetching streams:", error);
    return [];
  }
}