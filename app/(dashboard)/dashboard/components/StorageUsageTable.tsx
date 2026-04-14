"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Loader2, Database, HardDrive, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytesAll } from "@/lib/storage/formatBytes";
import StorageUsageBar from "./StorageUsageBar";

type StorageRow = {
  schoolId:   string;
  schoolName: string;
  dbBytes:    number;
  r2Bytes:    number;
  totalBytes: number;
};

type ApiResponse = {
  totalDbSize: number;
  schools:     StorageRow[];
};

function MultiUnit({ bytes, colorClass }: { bytes: number; colorClass: string }) {
  const f = formatBytesAll(bytes);
  return (
    <div className="space-y-0.5 text-right font-mono">
      <div className={`font-semibold text-xs ${colorClass}`}>{f.gb}</div>
      <div className="text-[10px] text-slate-400">{f.kb}</div>
      <div className="text-[10px] text-slate-500">{f.raw}</div>
    </div>
  );
}

export default function StorageUsageTable() {
  const [schools,     setSchools]     = useState<StorageRow[]>([]);
  const [totalDbSize, setTotalDbSize] = useState<number>(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/storage");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse = await res.json();
      // Handle both old array format and new object format
      if (Array.isArray(json)) {
        setSchools(json as any);
        setTotalDbSize(0);
      } else {
        setSchools(json.schools ?? []);
        setTotalDbSize(json.totalDbSize ?? 0);
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to load storage data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const estimatedDb = schools.reduce((s, r) => s + r.dbBytes, 0);
  const totalR2     = schools.reduce((s, r) => s + r.r2Bytes, 0);

  return (
    <div className="space-y-4">

      {/* Actual DB size banner */}
      {totalDbSize > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              Actual PostgreSQL Database Size (Neon)
            </p>
            <div className="flex flex-wrap gap-4 mt-1">
              {(() => { const f = formatBytesAll(totalDbSize); return (
                <>
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{f.gb}</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">{f.kb}</span>
                  <span className="text-xs text-blue-500 dark:text-blue-500">{f.raw}</span>
                </>
              ); })()}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 shrink-0">
            <Info className="h-3.5 w-3.5" />
            <span>Includes indexes, TOAST & system overhead</span>
          </div>
        </div>
      )}

      {/* Summary row + refresh */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">Estimated per-school DB:</span>
            <span className="font-semibold">{formatBytesAll(estimatedDb).gb}</span>
            <span className="text-xs text-slate-400">({formatBytesAll(estimatedDb).kb})</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">R2 Files:</span>
            <span className="font-semibold">{formatBytesAll(totalR2).gb}</span>
            <span className="text-xs text-slate-400">({formatBytesAll(totalR2).kb})</span>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={fetchData} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Per-school table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">School</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span className="flex items-center justify-end gap-1"><Database className="h-3 w-3 text-blue-500" />DB (est.)</span>
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span className="flex items-center justify-end gap-1"><HardDrive className="h-3 w-3 text-amber-500" />R2 Files</span>
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-44">Breakdown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading && Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}>
                {[...Array(5)].map((_, j) => (
                  <td key={j} className="px-5 py-4">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
            {!loading && schools.length === 0 && !error && (
              <tr><td colSpan={5} className="text-center py-10 text-sm text-muted-foreground">No data available.</td></tr>
            )}
            {!loading && schools.map((row, i) => (
              <tr key={row.schoolId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-5 shrink-0">#{i + 1}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{row.schoolName}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <MultiUnit bytes={row.dbBytes} colorClass="text-blue-600 dark:text-blue-400" />
                </td>
                <td className="px-4 py-3.5">
                  <MultiUnit bytes={row.r2Bytes} colorClass="text-amber-600 dark:text-amber-400" />
                </td>
                <td className="px-4 py-3.5">
                  <MultiUnit bytes={row.totalBytes} colorClass="text-primary" />
                </td>
                <td className="px-5 py-3.5 w-44">
                  <StorageUsageBar dbBytes={row.dbBytes} r2Bytes={row.r2Bytes} totalBytes={row.totalBytes} />
                </td>
              </tr>
            ))}
          </tbody>
          {!loading && schools.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <td className="px-5 py-3 font-bold text-slate-700 dark:text-slate-300">Totals</td>
                <td className="px-4 py-3">
                  <MultiUnit bytes={estimatedDb} colorClass="text-blue-600 dark:text-blue-400" />
                </td>
                <td className="px-4 py-3">
                  <MultiUnit bytes={totalR2} colorClass="text-amber-600 dark:text-amber-400" />
                </td>
                <td className="px-4 py-3">
                  <MultiUnit bytes={estimatedDb + totalR2} colorClass="text-primary" />
                </td>
                <td className="px-5 py-3">
                  <StorageUsageBar dbBytes={estimatedDb} r2Bytes={totalR2} totalBytes={estimatedDb + totalR2} />
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 shrink-0" />
        DB figures are proportional estimates based on row counts. The actual Neon database size shown above is the authoritative total.
      </p>
    </div>
  );
}
