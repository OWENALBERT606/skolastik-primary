// app/school/[slug]/users/parents/[parentId]/page.tsx

import { authOptions } from "@/config/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/prisma/db";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import ParentDetailClient from "../components/parent-detail-client";

export default async function ParentDetailPage({
  params,
}: {
  params: Promise<{ slug: string; parentId: string }>;
}) {
  const { slug, parentId } = await params;
  const session = (await getServerSession(authOptions)) as Session | null;
  const schoolId = session?.user?.school?.id;
  const schoolName = session?.user?.school?.name;
  const userId = session?.user?.id;
  
  if (!schoolId || !slug || !userId) {
    redirect("/login");
  }

  // Get parent with complete information
  const parent = await db.parent.findFirst({
    where: { 
      id: parentId,
      schoolId: schoolId, // Ensure parent belongs to this school
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          status: true,
          isVerfied: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      students: {
        include: {
          enrollments: {
            where: {
              status: "ACTIVE",
            },
            include: {
              classYear: {
                include: {
                  classTemplate: true,
                },
              },
              stream: true,
              term: {
                include: {
                  academicYear: true,
                },
              },
              academicYear: true,
              subjectEnrollments: {
                include: {
                  streamSubject: {
                    include: {
                      subject: true,
                    },
                  },
                },
              },
              reportCard: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          school: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      school: true,
    },
  });

  // If parent not found or doesn't belong to this school, return 404
  if (!parent) {
    notFound();
  }

  // Transform dates to strings for client component
  const parentData = {
    ...parent,
    dob: parent.dob ? parent.dob.toISOString() : null,
    createdAt: parent.createdAt.toISOString(),
    updatedAt: parent.updatedAt.toISOString(),
    user: {
      ...parent.user,
      createdAt: parent.user.createdAt.toISOString(),
      updatedAt: parent.user.updatedAt.toISOString(),
    },
    students: parent.students.map((student) => ({
      ...student,
      dob: student.dob.toISOString(),
      admissionDate: student.admissionDate.toISOString(),
      createdAt: student.createdAt.toISOString(),
      updatedAt: student.updatedAt.toISOString(),
      enrollments: student.enrollments.map((enrollment) => ({
        ...enrollment,
        createdAt: enrollment.createdAt.toISOString(),
        updatedAt: enrollment.updatedAt.toISOString(),
      })),
    })),
  };

  return (
    <div className="">
      <ParentDetailClient
        parent={parentData as any}
        schoolName={schoolName || "School"}
        slug={slug}
        userId={userId}
      />
    </div>
  );
}