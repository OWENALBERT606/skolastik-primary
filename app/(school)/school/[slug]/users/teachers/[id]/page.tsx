

// app/school/[slug]/users/teachers/[id]/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";
import { getTeacherById } from "@/actions/teachers";
import { notFound } from "next/navigation";
import TeacherDetailClient from "../components/teacher-detail-client";
export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id, slug } = await params;
  
  const session = await getServerSession(authOptions);
  const teacher = await getTeacherById(id);

  if (!teacher) {
    notFound();
  }

  return <TeacherDetailClient teacher={teacher} slug={slug} />;
}