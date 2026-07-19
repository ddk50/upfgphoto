// EXIF 撮影日の抽出はライブラリ追加せずファイルの lastModified で代替（モック）。
// 実プロダクトでは exifr 等で EXIF "DateTimeOriginal" を読む。
export function inferShotDate(file: File): Date {
  if (file.lastModified > 0) return new Date(file.lastModified)
  return new Date()
}

export function buildAutoFolderPath(date: Date): string {
  const y = date.getFullYear().toString().padStart(4, "0")
  const m = (date.getMonth() + 1).toString().padStart(2, "0")
  const d = date.getDate().toString().padStart(2, "0")
  return `/${y}/${m}/${d}`
}

export type AutoFolderBucket = {
  folderPath: string
  files: File[]
}

export function groupByAutoFolder(files: File[]): AutoFolderBucket[] {
  const map = new Map<string, File[]>()
  for (const file of files) {
    const folder = buildAutoFolderPath(inferShotDate(file))
    const existing = map.get(folder) ?? []
    existing.push(file)
    map.set(folder, existing)
  }
  return Array.from(map.entries())
    .map(([folderPath, files]) => ({ folderPath, files }))
    .sort((a, b) => a.folderPath.localeCompare(b.folderPath))
}
