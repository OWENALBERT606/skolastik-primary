// app/(dos)/school/[slug]/dos/teachers/[id]/page.tsx
import { getAuthenticatedUser } from "@/config/useAuth";
import { getTeacherById }       from "@/actions/teachers";
import { notFound }             from "next/navigation";
import TeacherDetailClient      from "@/app/(school)/school/[slug]/users/teachers/components/teacher-detail-client";

export default async function DOSTeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id, slug } = await params;
  await getAuthenticatedUser();

  const teacher = await getTeacherById(id);
  if (!teacher) notFound();

  return (
    <TeacherDetailClient
      teacher={teacher}
      slug={slug}
      backUrl={`/school/${slug}/dos/teachers`}
    />
  );
}
