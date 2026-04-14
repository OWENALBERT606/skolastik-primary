"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, FileDown, Loader2 } from "lucide-react";
import type { TimetablePDFProps } from "./timetable-pdf";

type StreamOption = {
  id:        string;
  name:      string;
  className: string;
  label:     string;
};

export default function IndividualDownload({
  versionId,
  versionLabel,
}: {
  versionId:    string;
  versionLabel: string;
}) {
  const [open,      setOpen]      = useState(false);
  const [streams,   setStreams]   = useState<StreamOption[]>([]);
  const [streamId,  setStreamId]  = useState<string>("");
  const [loading,   setLoading]   = useState(false);
  const [fetching,  setFetching]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Load stream list when dialog opens
  useEffect(() => {
    if (!open || streams.length > 0) return;
    setFetching(true);
    fetch(`/api/timetable/versions/${versionId}/streams`)
      .then(r => r.json())
      .then(d => setStreams(d.streams ?? []))
      .catch(() => setError("Failed to load streams"))
      .finally(() => setFetching(false));
  }, [open, versionId, streams.length]);

  async function handleDownload() {
    if (!streamId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/timetable/versions/${versionId}/pdf?streamId=${streamId}`);
      if (!res.ok) throw new Error("Failed to fetch PDF data");
      const data: TimetablePDFProps = await res.json();

      const [{ default: TimetablePDF }, { pdf }] = await Promise.all([
        import("./timetable-pdf"),
        import("@react-pdf/renderer"),
      ]);

      const stream = streams.find(s => s.id === streamId);
      const blob   = await pdf(<TimetablePDF {...data} />).toBlob();
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement("a");
      a.href       = url;
      a.download   = `${versionLabel}_${stream?.label ?? streamId}.pdf`.replace(/\s+/g, "_");
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message ?? "Download failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadAll() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/timetable/versions/${versionId}/pdf`);
      if (!res.ok) throw new Error("Failed to fetch PDF data");
      const data: TimetablePDFProps = await res.json();

      const [{ default: TimetablePDF }, { pdf }] = await Promise.all([
        import("./timetable-pdf"),
        import("@react-pdf/renderer"),
      ]);

      const blob = await pdf(<TimetablePDF {...data} />).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${versionLabel}_All_Streams.pdf`.replace(/\s+/g, "_");
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message ?? "Download failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileDown className="h-3.5 w-3.5 mr-1" />Download
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Download Timetable PDF</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* All streams */}
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">Download all streams in one PDF</p>
              <Button
                className="w-full"
                onClick={handleDownloadAll}
                disabled={loading}
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  : <Download className="h-4 w-4 mr-2" />}
                All Streams
              </Button>
            </div>

            <div className="relative flex items-center gap-2">
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            </div>

            {/* Individual stream */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Download a single class timetable</p>
              {fetching ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />Loading streams…
                </div>
              ) : (
                <Select value={streamId} onValueChange={setStreamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class / stream" />
                  </SelectTrigger>
                  <SelectContent>
                    {streams.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDownload}
                disabled={!streamId || loading}
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  : <Download className="h-4 w-4 mr-2" />}
                Download Selected
              </Button>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
