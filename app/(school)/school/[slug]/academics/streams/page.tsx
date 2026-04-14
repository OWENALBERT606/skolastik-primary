

// app/dashboard/streams/page.tsx
import { Suspense } from "react";
import { getStreamsBySchoolActiveYear, getStreamsByAcademicYear } from "@/actions/streams";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthenticatedUser } from "@/config/useAuth";
import { getSchoolsByAdminId } from "@/actions/schools";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { db } from "@/prisma/db";
import StreamsManagement from "./components/streams-management";

async function StreamsContent({ yearId }: { yearId?: string }) {
  try {
    const userData = await getAuthenticatedUser();
    if (!userData?.id) redirect("/login");

    const schoolData = await getSchoolsByAdminId(userData.id);
    const school = schoolData.data?.[0];

    if (!school?.id) {
      return (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No School Found</h3>
            <p className="text-sm text-muted-foreground">Your account is not associated with any school.</p>
          </div>
        </Card>
      );
    }

    const [academicYears, streams] = await Promise.all([
      db.academicYear.findMany({
        where: { schoolId: school.id },
        orderBy: { year: "desc" },
      }),
      yearId
        ? getStreamsByAcademicYear(school.id, yearId)
        : getStreamsBySchoolActiveYear(school.id),
    ]);

    const activeYear = academicYears.find((y) => y.isActive) ?? academicYears[0];
    const currentYearId = yearId ?? activeYear?.id ?? "";

    return (
      <StreamsManagement
        streams={streams}
        schoolId={school.id}
        academicYears={academicYears}
        currentYearId={currentYearId}
      />
    );
  } catch (error: any) {
    console.error("❌ Error loading streams:", error);
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

export default async function StreamsPage({
  searchParams,
}: {
  searchParams: Promise<{ yearId?: string }>;
}) {
  const { yearId } = await searchParams;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Streams Management</h1>
        <p className="text-muted-foreground">
          Manage class streams, subjects, and student enrollments
        </p>
      </div>

      <Suspense fallback={<StreamsLoadingSkeleton />}>
        <StreamsContent yearId={yearId} />
      </Suspense>
    </div>
  );
}

function StreamsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>

      {/* Streams Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}