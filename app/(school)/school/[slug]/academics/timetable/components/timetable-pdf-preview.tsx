"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Eye, Loader2, X } from "lucide-react";
import type { TimetablePDFProps } from "./timetable-pdf";

// PDFViewer and pdf() are client-only — loaded dynamically inside the component

export default function TimetablePDFPreview({
  versionId,
  label,
}: {
  versionId: string;
  label:     string;
}) {
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [dlLoading, setDlLoading] = useState(false);
  const [data, setData]         = useState<TimetablePDFProps | null>(null);
  const [error, setError]       = useState<string | null>(null);

  // Fetch PDF data when modal opens
  useEffect(() => {
    if (!open || data) return;
    setLoading(true);
    setError(null);
    fetch(`/api/timetable/versions/${versionId}/pdf`)
      .then(r => r.ok ? r.json() : r.json().then((e: any) => Promise.reject(e.error)))
      .then(setData)
      .catch((e: any) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [open, versionId, data]);

  async function handleDownload() {
    if (!data) return;
    setDlLoading(true);
    try {
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
    } finally {
      setDlLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Eye className="h-3.5 w-3.5 mr-1" />Preview PDF
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b shrink-0">
            <DialogTitle className="text-sm font-semibold">{label} — PDF Preview</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={!data || dlLoading}
              >
                {dlLoading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  : <Download className="h-3.5 w-3.5 mr-1" />}
                {dlLoading ? "Generating…" : "Download PDF"}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden bg-gray-100">
            {loading && (
              <div className="flex items-center justify-center h-full gap-2 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading timetable data…</span>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center h-full text-red-500 text-sm">
                {error}
              </div>
            )}
            {data && !loading && <PDFViewerInner data={data} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Separate component so we can lazy-render PDFViewer only when data is ready
function PDFViewerInner({ data }: { data: TimetablePDFProps }) {
  const [Viewer, setViewer] = useState<React.ComponentType<any> | null>(null);
  const [PDF, setPDF]       = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    Promise.all([
      import("@react-pdf/renderer").then(m => m.PDFViewer),
      import("./timetable-pdf").then(m => m.default),
    ]).then(([viewer, pdf]) => {
      setViewer(() => viewer);
      setPDF(() => pdf);
    });
  }, []);

  if (!Viewer || !PDF) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Rendering PDF…</span>
      </div>
    );
  }

  return (
    <Viewer width="100%" height="100%" showToolbar={true} style={{ border: "none" }}>
      <PDF {...data} />
    </Viewer>
  );
}
