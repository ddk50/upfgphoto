const UNITS = ["B", "KB", "MB", "GB", "TB"]

export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (bytes < 0 || !Number.isFinite(bytes)) return "—"
  if (bytes === 0) return "0 B"
  const i = Math.min(UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : fractionDigits)} ${UNITS[i]}`
}
