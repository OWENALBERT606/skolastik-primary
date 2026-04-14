"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import type { TimetablePDFProps } from "./timetable-pdf";

export default function DownloadPDFButton({
  versionId,
  label,
}: {
  versionId: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/timetable/versions/${versionId}/pdf`);
      if (!res.ok) throw new Error("Failed to fetch PDF data");
      const data: TimetablePDFProps = await res.json();

      // Dynamic import — @react-pdf/renderer is client-only
      const [{ default: TimetablePDF }, { pdf }] = await Promise.all([
        import("./timetable-pdf"),
        import("@react-pdf/renderer"),
      ]);

      const blob = await pdf(<TimetablePDF {...data} />).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${label.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message ?? "Download failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
        {loading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          : <Download className="h-3.5 w-3.5 mr-1" />}
        {loading ? "Generating…" : "Download PDF"}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
