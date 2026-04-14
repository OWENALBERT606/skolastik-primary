

// app/school/[slug]/users/parents/page.tsx
import { authOptions } from "@/config/auth";
import { redirect } from "next/navigation";
import { db } from "@/prisma/db";
import ParentsManagementtt from "./components/parent-management-view-table";
import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";

export default async function ParentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getServerSession(authOptions) as Session | null;
  const schoolId = session?.user?.school?.id;
const schoolName = session?.user?.school?.name;
const userId = session?.user?.id;

  if (!schoolId || !slug || !userId) {
    redirect("/login");
  }

  // Get all parents with their students and enrollments
  const parents = await db.parent.findMany({
    where: { schoolId },
    include: {
      user: {
        select: {
          id: true,
          status: true,
          isVerfied: true,
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
                  classTemplate: {
                    select: {
                      name: true,
                      code: true,
                    },
                  },
                },
              },
              stream: {
                select: {
                  name: true,
                },
              },
            },
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform dates to strings for client component
  const parentsData = parents.map((parent) => ({
    ...parent,
    dob: parent.dob ? parent.dob.toISOString() : null,
    createdAt: parent.createdAt.toISOString(),
    students: parent.students.map((student) => ({
      ...student,
      dob: student.dob ? student.dob.toISOString() : null,
      createdAt: student.createdAt.toISOString(),
      enrollments: student.enrollments,
    })),
  }));

  return (
    <div className="">
      <ParentsManagementtt
        initialParents={parentsData as any}
        schoolId={schoolId}
        schoolName={schoolName || "School"}
        slug={slug}
        userId={userId}
      />
    </div>
  );
}