"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DayConfigTab           from "./day-config-tab";
import GenerateTab            from "./generate-tab";
import VersionsTab            from "./versions-tab";
import TeacherAvailabilityTab from "./teacher-availability-tab";
import SubjectPeriodsTab      from "./subject-periods-tab";

type Term    = { id: string; name: string; termNumber: number; startDate: string; endDate: string };
type Year    = { id: string; year: string; terms: Term[] };
type Version = {
  id: string; versionNumber: number; label: string | null; status: string;
  termId: string; generatedAt: string; publishedAt: string | null;
  _count: { slots: number; conflicts: number };
};
type Day = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
type Availability = { dayOfWeek: Day; isAvailable: boolean; availableFrom: string | null; availableTo: string | null };
type Teacher = { id: string; firstName: string; lastName: string; staffNo: string; employmentType: string; availabilities: Availability[] };

export default function TimetableClient({
  schoolId, slug, years, versions: initialVersions, teachers, classYears, classYearsWithSubjects,
}: {
  schoolId:               string;
  slug:                   string;
  years:                  Year[];
  versions:               Version[];
  teachers:               Teacher[];
  classYears:             any[];
  classYearsWithSubjects: any[];
}) {
  const [versions, setVersions] = useState<Version[]>(initialVersions);

  return (
    <Tabs defaultValue="availability" className="space-y-4">
      <TabsList className="grid w-full grid-cols-5 max-w-3xl">
        <TabsTrigger value="availability">Availability</TabsTrigger>
        <TabsTrigger value="periods">Periods</TabsTrigger>
        <TabsTrigger value="day-config">Day Config</TabsTrigger>
        <TabsTrigger value="generate">Generate</TabsTrigger>
        <TabsTrigger value="versions">Versions</TabsTrigger>
      </TabsList>

      <TabsContent value="availability">
        <TeacherAvailabilityTab schoolId={schoolId} teachers={teachers ?? []} />
      </TabsContent>

      <TabsContent value="periods">
        <SubjectPeriodsTab classYears={classYearsWithSubjects ?? []} />
      </TabsContent>

      <TabsContent value="day-config">
        <DayConfigTab schoolId={schoolId} classYears={classYears} />
      </TabsContent>

      <TabsContent value="generate">
        <GenerateTab
          schoolId={schoolId}
          years={years}
          onGenerated={(v) => setVersions(prev => [v, ...prev])}
        />
      </TabsContent>

      <TabsContent value="versions">
        <VersionsTab
          schoolId={schoolId}
          slug={slug}
          versions={versions}
          years={years}
          onUpdate={(updated) =>
            setVersions(prev => prev.map(v => v.id === updated.id ? { ...v, ...updated } : v))
          }
        />
      </TabsContent>
    </Tabs>
  );
}
