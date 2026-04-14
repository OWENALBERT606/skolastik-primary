export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0.00 GB";
  const GB = 1024 * 1024 * 1024;
  return `${(bytes / GB).toFixed(decimals)} GB`;
}

/** Auto-scale version for tooltips / small values */
export function formatBytesAuto(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/** Returns all three units: GB, KB, Bytes */
export function formatBytesAll(bytes: number): { gb: string; kb: string; raw: string } {
  return {
    gb:  `${(bytes / (1024 * 1024 * 1024)).toFixed(4)} GB`,
    kb:  `${(bytes / 1024).toFixed(2)} KB`,
    raw: `${bytes.toLocaleString()} B`,
  };
}
