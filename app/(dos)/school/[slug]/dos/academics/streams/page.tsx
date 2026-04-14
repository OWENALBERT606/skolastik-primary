// DOS Streams page — mirrors admin streams page but under DOS route
import { Suspense } from "react";
import { getStreamsBySchoolActiveYear, getStreamsByAcademicYear } from "@/actions/streams";
import StreamsManagement from "@/app/(school)/school/[slug]/academics/streams/components/streams-management";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { db } from "@/prisma/db";
import { notFound } from "next/navigation";

async function StreamsContent({ schoolId, yearId }: { schoolId: string; yearId?: string }) {
  try {
    const [academicYears, streams] = await Promise.all([
      db.academicYear.findMany({
        where: { schoolId },
        orderBy: { year: "desc" },
      }),
      yearId
        ? getStreamsByAcademicYear(schoolId, yearId)
        : getStreamsBySchoolActiveYear(schoolId),
    ]);

    const activeYear = academicYears.find((y) => y.isActive) ?? academicYears[0];
    const currentYearId = yearId ?? activeYear?.id ?? "";

    return (
      <StreamsManagement
        streams={streams}
        schoolId={schoolId}
        academicYears={academicYears}
        currentYearId={currentYearId}
      />
    );
  } catch (error: any) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Streams</h3>
          <p className="text-sm text-muted-foreground">{error.message || "Failed to load streams"}</p>
        </div>
      </Card>
    );
  }
}

export default async function DOSStreamsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ yearId?: string }>;
}) {
  const [{ slug }, { yearId }] = await Promise.all([params, searchParams]);
  const school = await db.school.findUnique({ where: { slug }, select: { id: true } });
  if (!school) notFound();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Streams Management</h1>
        <p className="text-muted-foreground">Manage class streams, subjects, and student enrollments</p>
      </div>
      <Suspense fallback={<StreamsLoadingSkeleton />}>
        <StreamsContent schoolId={school.id} yearId={yearId} />
      </Suspense>
    </div>
  );
}

function StreamsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16" /></Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6"><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-48 mb-4" /></Card>
        ))}
      </div>
    </div>
  );
}
