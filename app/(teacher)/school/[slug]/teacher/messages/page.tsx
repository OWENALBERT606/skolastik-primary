import { getAuthenticatedUser } from "@/config/useAuth";
import { redirect } from "next/navigation";
import { getMessagesBySchool } from "@/actions/communication-actions";
import TeacherMessagesClient from "./teacher-messages-client";
import { db } from "@/prisma/db";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function TeacherMessagesPage({ params, searchParams }: Props) {
  const userData = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  const { slug } = await params;
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const school = await db.school.findUnique({ where: { slug }, select: { id: true } });
  if (!school) redirect("/school");

  // Fetch only messages relevant to teaching staff (ALL, ALL_STAFF, TEACHERS)
  const [allResult, staffResult, teacherResult] = await Promise.all([
    getMessagesBySchool(school.id, { status: "SENT", audience: "ALL", page, pageSize: 10 }),
    getMessagesBySchool(school.id, { status: "SENT", audience: "ALL_STAFF", page, pageSize: 10 }),
    getMessagesBySchool(school.id, { status: "SENT", audience: "TEACHERS", page, pageSize: 10 }),
  ]);

  // Merge and sort by date
  const allMessages = [
    ...((allResult.data as any[]) ?? []),
    ...((staffResult.data as any[]) ?? []),
    ...((teacherResult.data as any[]) ?? []),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = (allResult.total ?? 0) + (staffResult.total ?? 0) + (teacherResult.total ?? 0);

  return (
    <TeacherMessagesClient
      slug={slug}
      messages={allMessages}
      total={total}
      page={page}
    />
  );
}
