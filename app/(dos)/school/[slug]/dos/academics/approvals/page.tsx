// DOS Approvals page — mirrors admin approvals page but under DOS route
import { getAuthenticatedUser } from "@/config/useAuth";
import { notFound } from "next/navigation";
import MarksApprovalsClient from "@/app/(school)/school/[slug]/academics/approvals/components/marks-approvals-client";
import { getMarksApprovalsData } from "@/actions/marks-approval";
import { db } from "@/prisma/db";

export default async function DOSApprovalsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const authUser = await getAuthenticatedUser();

  const school = await db.school.findUnique({ where: { slug }, select: { id: true } });
  if (!school) notFound();

  const result = await getMarksApprovalsData(school.id);
  if (!result.ok || !result.data) notFound();

  return (
    <div className="p-6">
      <MarksApprovalsClient
        data={result.data}
        approverId={authUser.id}
        schoolId={school.id}
        slug={slug}
      />
    </div>
  );
}
