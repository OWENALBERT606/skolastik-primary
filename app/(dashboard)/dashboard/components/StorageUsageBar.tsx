"use client";

import { formatBytesAuto } from "@/lib/storage/formatBytes";

type Props = { dbBytes: number; r2Bytes: number; totalBytes: number };

export default function StorageUsageBar({ dbBytes, r2Bytes, totalBytes }: Props) {
  if (totalBytes === 0) {
    return <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800" />;
  }

  const dbPct = Math.round((dbBytes / totalBytes) * 100);
  const r2Pct = 100 - dbPct;

  return (
    <div className="space-y-1">
      <div className="flex w-full h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {dbPct > 0 && (
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${dbPct}%` }}
            title={`DB: ${formatBytesAuto(dbBytes)}`}
          />
        )}
        {r2Pct > 0 && (
          <div
            className="h-full bg-amber-400 transition-all"
            style={{ width: `${r2Pct}%` }}
            title={`Files: ${formatBytesAuto(r2Bytes)}`}
          />
        )}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />DB {dbPct}%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Files {r2Pct}%</span>
      </div>
    </div>
  );
}
