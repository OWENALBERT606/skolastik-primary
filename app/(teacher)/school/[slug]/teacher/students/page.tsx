import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/config/useAuth";
import { getTeacherStudents } from "@/actions/teacher-portal";
import TeacherStudentsClient from "./teacher-students-client";

export default async function TeacherStudentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const userData = await getAuthenticatedUser();
  if (!userData?.id) redirect("/login");

  const result = await getTeacherStudents(userData.id);

  if (!result.ok) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <p className="text-slate-500 dark:text-slate-400 font-medium">Failed to load students</p>
        <p className="text-sm text-slate-400 mt-1">{result.message}</p>
      </div>
    );
  }

  return <TeacherStudentsClient subjects={result.data} slug={slug} />;
}
