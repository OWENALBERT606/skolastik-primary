


// // // // app/school/[slug]/students/page.tsx
// // // import { getServerSession } from "next-auth/next";
// // // import { authOptions } from "@/config/auth";
// // // import { redirect } from "next/navigation";
// // // import { db } from "@/prisma/db";
// // // import StudentsListClient from "./components/students-list-client";
// // // import { Session } from "next-auth";
// // // import { headers } from "next/headers";

// // // export default async function StudentsPage({
// // //   params,
// // // }: {
// // //   params: Promise<{ slug: string }>;
// // // }) {
// // //   const { slug } = await params;
// // //     await headers(); // ✅ await headers before getServerSession

// // //   const session = await getServerSession(authOptions) as Session | null;
// // //   const schoolId = session?.user?.school?.id;
// // //   const userId = session?.user?.id;
// // //   if (!schoolId || !slug || !userId) {
// // //     redirect("/login");
// // //   }

// // //   // Get all academic years
// // //   const academicYears = await db.academicYear.findMany({
// // //     where: { schoolId },
// // //     orderBy: { year: "desc" },
// // //   });

// // //   // Get current academic year
// // //   const currentYear = academicYears.find((year) => year.isActive) || academicYears[0];

// // //   // Get all class templates
// // //   const classTemplates = await db.classTemplate.findMany({
// // //     where: { schoolId },
// // //     orderBy: { level: "asc" },
// // //   });

// // //   // Get all class years for all academic years (needed for enrollment)
// // //   const classYears = await db.classYear.findMany({
// // //     where: {
// // //       academicYear: {
// // //         schoolId: schoolId,
// // //       },
// // //       isActive: true,
// // //     },
// // //     include: {
// // //       classTemplate: true,
// // //       streams: true,
// // //     },
// // //     orderBy: {
// // //       classTemplate: {
// // //         level: "asc",
// // //       },
// // //     },
// // //   });

// // //   const streams = classYears.flatMap(cy =>
// // //   cy.streams.map(stream => ({
// // //     id: stream.id,
// // //     name: stream.name,
// // //     classYearId: stream.classYearId,
// // //   }))
// // // );


// // // const classYearsForUI = classYears.map(cy => ({
// // //   id: cy.id,
// // //   name: cy.classTemplate.name, // 👈 UI label
// // //   academicYearId: cy.academicYearId,
// // // }));


// // //   // Get all parents
// // //   const parents = await db.parent.findMany({
// // //     where: { schoolId },
// // //     select: {
// // //       id: true,
// // //       firstName: true,
// // //       lastName: true,
// // //       phone: true,
// // //       email: true,
// // //     },
// // //     orderBy: { firstName: "asc" },
// // //   });

// // //   // Get students with current enrollment
// // //   const students = await db.student.findMany({
// // //     where: { schoolId, isActive: true },
// // //     include: {
// // //       parent: {
// // //         select: {
// // //           id: true,
// // //           firstName: true,
// // //           lastName: true,
// // //           phone: true,
// // //         },
// // //       },
// // //       enrollments: {
// // //         where: {
// // //           status: "ACTIVE",
// // //         },
// // //         include: {
// // //           classYear: {
// // //             include: {
// // //               classTemplate: true,
// // //             },
// // //           },
// // //           stream: true,
// // //           academicYear: true,
// // //           term: true,
// // //         },
// // //         orderBy: {
// // //           createdAt: "desc",
// // //         },
// // //         take: 1,
// // //       },
// // //     },
// // //     orderBy: { createdAt: "desc" },
// // //   });

// // //   return (
// // //     <div className="p-6">
// // //       <StudentsListClient
// // //         students={students}
// // //         parents={parents}
// // //         academicYears={academicYears}
// // //         currentYear={currentYear}
// // //         classTemplates={classTemplates}
// // //         classYears={classYearsForUI ?? []}
// // //         streams={streams ?? []}
// // //         schoolId={schoolId}
// // //         slug={slug}
// // //         userId={userId}
// // //       />
// // //     </div>
// // //   );
// // // }


// // // app/school/[slug]/students/page.tsx

// // import { getServerSession } from "next-auth/next";
// // import { authOptions } from "@/config/auth";
// // import { redirect } from "next/navigation";
// // import { db } from "@/prisma/db";
// // import StudentsListClient from "./components/students-list-client";

// // export default async function StudentsPage({
// //   params,
// // }: {
// //   params: { slug: string }; // ✅ FIXED (not Promise)
// // }) {
// //   const { slug } = params; // ✅ no await needed

// //   const session = await getServerSession(authOptions);

// //   const schoolId = session?.user?.school?.id;
// //   const userId = session?.user?.id;

// //   if (!schoolId || !slug || !userId) {
// //     redirect("/login");
// //   }

// //   // ===============================
// //   // Academic Years
// //   // ===============================
// //   const academicYears = await db.academicYear.findMany({
// //     where: { schoolId },
// //     orderBy: { year: "desc" },
// //   });

// //   const currentYear =
// //     academicYears.find((year) => year.isActive) || academicYears[0];

// //   // ===============================
// //   // Class Templates
// //   // ===============================
// //   const classTemplates = await db.classTemplate.findMany({
// //     where: { schoolId },
// //     orderBy: { level: "asc" },
// //   });

// //   // ===============================
// //   // Class Years
// //   // ===============================
// //   const classYears = await db.classYear.findMany({
// //     where: {
// //       academicYear: {
// //         schoolId,
// //       },
// //       isActive: true,
// //     },
// //     include: {
// //       classTemplate: true,
// //       streams: true,
// //     },
// //     orderBy: {
// //       classTemplate: {
// //         level: "asc",
// //       },
// //     },
// //   });

// //   const streams = classYears.flatMap((cy) =>
// //     cy.streams.map((stream) => ({
// //       id: stream.id,
// //       name: stream.name,
// //       classYearId: stream.classYearId,
// //     }))
// //   );

// //   const classYearsForUI = classYears.map((cy) => ({
// //     id: cy.id,
// //     name: cy.classTemplate.name,
// //     academicYearId: cy.academicYearId,
// //   }));

// //   // ===============================
// //   // Parents
// //   // ===============================
// //   const parents = await db.parent.findMany({
// //     where: { schoolId },
// //     select: {
// //       id: true,
// //       firstName: true,
// //       lastName: true,
// //       phone: true,
// //       email: true,
// //     },
// //     orderBy: { firstName: "asc" },
// //   });

// //   // ===============================
// //   // Students
// //   // ===============================
// //   const students = await db.student.findMany({
// //     where: { schoolId, isActive: true },
// //     include: {
// //       parent: {
// //         select: {
// //           id: true,
// //           firstName: true,
// //           lastName: true,
// //           phone: true,
// //         },
// //       },
// //       enrollments: {
// //         where: { status: "ACTIVE" },
// //         include: {
// //           classYear: {
// //             include: {
// //               classTemplate: true,
// //             },
// //           },
// //           stream: true,
// //           academicYear: true,
// //           term: true,
// //         },
// //         orderBy: { createdAt: "desc" },
// //         take: 1,
// //       },
// //     },
// //     orderBy: { createdAt: "desc" },
// //   });

// //   return (
// //     <div className="p-6">
// //       <StudentsListClient
// //         students={students}
// //         parents={parents}
// //         academicYears={academicYears}
// //         currentYear={currentYear}
// //         classTemplates={classTemplates}
// //         classYears={classYearsForUI}
// //         streams={streams}
// //         schoolId={schoolId}
// //         slug={slug}
// //         userId={userId}
// //       />
// //     </div>
// //   );
// // }






// // app/(school)/school/[slug]/users/students/page.tsx

// import { redirect } from "next/navigation";
// import { db } from "@/prisma/db";
// import StudentsListClient from "./components/students-list-client";
// import { getAuthenticatedUser } from "@/config/useAuth"; // ✅ use helper

// export default async function StudentsPage({
//   params,
// }: {
//   params: Promise<{ slug: string }>;
// }) {
//   const { slug } = await params;

//   const userData = await getAuthenticatedUser();
//   console.log("👤 userData.id:", userData?.id);
// console.log("🏫 userData.school:", JSON.stringify(userData?.school));
// console.log("🔑 userData.roles:", JSON.stringify(userData?.roles));
//   const schoolId = userData?.school?.id;
//   const userId = userData?.id;

//   if (!schoolId || !slug || !userId) {
//     redirect("/login");
//   }

//   const academicYears = await db.academicYear.findMany({
//     where: { schoolId },
//     orderBy: { year: "desc" },
//   });

//   const currentYear = academicYears.find((year) => year.isActive) || academicYears[0];

//   const classTemplates = await db.classTemplate.findMany({
//     where: { schoolId },
//     orderBy: { level: "asc" },
//   });

//   const classYears = await db.classYear.findMany({
//     where: { academicYear: { schoolId }, isActive: true },
//     include: { classTemplate: true, streams: true },
//     orderBy: { classTemplate: { level: "asc" } },
//   });

//   const streams = classYears.flatMap((cy) =>
//     cy.streams.map((stream) => ({
//       id: stream.id,
//       name: stream.name,
//       classYearId: stream.classYearId,
//     }))
//   );

//   const classYearsForUI = classYears.map((cy) => ({
//     id: cy.id,
//     name: cy.classTemplate.name,
//     academicYearId: cy.academicYearId,
//   }));

//   const parents = await db.parent.findMany({
//     where: { schoolId },
//     select: { id: true, firstName: true, lastName: true, phone: true, email: true },
//     orderBy: { firstName: "asc" },
//   });

//   const students = await db.student.findMany({
//     where: { schoolId, isActive: true },
//     include: {
//       parent: { select: { id: true, firstName: true, lastName: true, phone: true } },
//       enrollments: {
//         where: { status: "ACTIVE" },
//         include: {
//           classYear: { include: { classTemplate: true } },
//           stream: true,
//           academicYear: true,
//           term: true,
//         },
//         orderBy: { createdAt: "desc" },
//         take: 1,
//       },
//     },
//     orderBy: { createdAt: "desc" },
//   });

//   return (
//     <div className="p-6">
//       <StudentsListClient
//         students={students}
//         parents={parents}
//         academicYears={academicYears}
//         currentYear={currentYear}
//         classTemplates={classTemplates}
//         classYears={classYearsForUI}
//         streams={streams}
//         schoolId={schoolId}
//         slug={slug}
//         userId={userId}
//       />
//     </div>
//   );
// }




// app/school/[slug]/users/students/page.tsx

import { redirect } from "next/navigation";
import { db } from "@/prisma/db";
import StudentsListClient from "./components/students-list-client";
import { getAuthenticatedUser } from "@/config/useAuth";

export default async function StudentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const userData = await getAuthenticatedUser();
  const schoolId = userData?.school?.id;
  const userId = userData?.id;

  if (!schoolId || !slug || !userId) {
    redirect("/login");
  }

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { code: true },
  });
  const schoolCode = school?.code ?? slug;

  const [academicYears, classTemplates, classYears, parents, students] =
    await Promise.all([
      db.academicYear.findMany({
        where: { schoolId },
        orderBy: { year: "desc" },
      }),
      db.classTemplate.findMany({
        where: { schoolId },
        orderBy: { level: "asc" },
      }),
      db.classYear.findMany({
        where: { academicYear: { schoolId }, isActive: true },
        include: { classTemplate: true, streams: true },
        orderBy: { classTemplate: { level: "asc" } },
      }),
      db.parent.findMany({
        where: { schoolId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
        orderBy: { firstName: "asc" },
      }),
      db.student.findMany({
        where: { schoolId, isActive: true },
        include: {
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              classYear: { include: { classTemplate: true } },
              stream: true,
              academicYear: true,
              term: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const currentYear =
    academicYears.find((year) => year.isActive) || academicYears[0];

  const streams = classYears.flatMap((cy) =>
    cy.streams.map((stream) => ({
      id: stream.id,
      name: stream.name,
      classYearId: stream.classYearId,
    }))
  );

  const classYearsForUI = classYears.map((cy) => ({
    id: cy.id,
    name: cy.classTemplate.name,
    academicYearId: cy.academicYearId,
    classLevel: cy.classLevel,
  }));

  return (
    <div className="p-6 min-h-screen bg-zinc-50 dark:bg-[#0d1117]">
      <StudentsListClient
        students={students}
        parents={parents}
        academicYears={academicYears}
        currentYear={currentYear}
        classTemplates={classTemplates}
        classYears={classYearsForUI}
        streams={streams}
        schoolId={schoolId}
        schoolCode={schoolCode}
        slug={slug}
        userId={userId}
      />
    </div>
  );
}