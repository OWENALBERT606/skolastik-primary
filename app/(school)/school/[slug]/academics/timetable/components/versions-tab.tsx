"use client";

import { useState } from "react";
import { Badge }    from "@/components/ui/badge";
import { Button }   from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Eye, Loader2, Send } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const TimetablePDFPreview  = dynamic(() => import("./timetable-pdf-preview"),  { ssr: false });
const IndividualDownload   = dynamic(() => import("./individual-download"),     { ssr: false });

type Version = {
  id: string; versionNumber: number; label: string | null; status: string;
  termId: string; generatedAt: string; publishedAt: string | null;
  _count: { slots: number; conflicts: number };
};
type Year = { id: string; year: string; terms: { id: string; name: string }[] };

const STATUS_COLORS: Record<string, string> = {
  DRAFT:     "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  REVIEW:    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  PUBLISHED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  ARCHIVED:  "bg-gray-100 text-gray-500",
};

export default function VersionsTab({
  schoolId, slug, versions, years, onUpdate,
}: {
  schoolId:  string;
  slug:      string;
  versions:  Version[];
  years:     Year[];
  onUpdate:  (v: Partial<Version> & { id: string }) => void;
}) {
  const [publishing, setPublishing] = useState<string | null>(null);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  // Build term name lookup
  const termNames: Record<string, string> = {};
  for (const y of years) for (const t of y.terms) termNames[t.id] = `${y.year} — ${t.name}`;

  async function handlePublish(versionId: string) {
    setPublishing(versionId);
    setErrors(prev => ({ ...prev, [versionId]: "" }));
    try {
      const res  = await fetch(`/api/timetable/versions/${versionId}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErrors(prev => ({ ...prev, [versionId]: data.error ?? "Failed to publish" }));
      } else {
        onUpdate({ id: versionId, status: "PUBLISHED", publishedAt: data.version.publishedAt });
      }
    } finally {
      setPublishing(null);
    }
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-400">
          No timetable versions yet. Use the Generate tab to create one.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map(v => (
        <Card key={v.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-semibold">
                  {v.label ?? `Version ${v.versionNumber}`}
                </CardTitle>
                <p className="text-xs text-gray-500">{termNames[v.termId] ?? v.termId}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[v.status] ?? ""}`}>
                {v.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{v._count.slots}</span>
                <span className="text-gray-500 ml-1">slots</span>
              </div>
              <div>
                <span className={`font-semibold ${v._count.conflicts > 0 ? "text-red-600" : "text-slate-800 dark:text-slate-100"}`}>
                  {v._count.conflicts}
                </span>
                <span className="text-gray-500 ml-1">conflicts</span>
              </div>
              <div className="text-gray-400 text-xs self-center">
                Generated {new Date(v.generatedAt).toLocaleDateString()}
              </div>
            </div>

            {errors[v.id] && (
              <p className="text-xs text-red-600 flex gap-1.5 items-center">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />{errors[v.id]}
              </p>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/school/${slug}/academics/timetable/${v.id}`}>
                  <Eye className="h-3.5 w-3.5 mr-1" />View
                </Link>
              </Button>
              <TimetablePDFPreview
                versionId={v.id}
                label={v.label ?? `Timetable_v${v.versionNumber}`}
              />
              <IndividualDownload
                versionId={v.id}
                versionLabel={v.label ?? `Timetable_v${v.versionNumber}`}
              />
              {v.status !== "PUBLISHED" && (
                <Button
                  size="sm"
                  onClick={() => handlePublish(v.id)}
                  disabled={publishing === v.id}
                >
                  {publishing === v.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    : <Send className="h-3.5 w-3.5 mr-1" />}
                  Publish
                </Button>
              )}
              {v.status === "PUBLISHED" && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Published {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : ""}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
