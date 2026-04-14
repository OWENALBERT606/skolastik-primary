import { redirect } from "next/navigation";
export default async function DOSAcademicsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/school/${slug}/dos/academics/classes`);
}
