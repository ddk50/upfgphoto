export function splitPath(path: string): string[] {
  return path.split("/").filter((s) => s.length > 0)
}

export function dirParts(path: string): string[] {
  const parts = splitPath(path)
  return parts.slice(0, -1)
}

export function fileName(path: string): string {
  const parts = splitPath(path)
  return parts.at(-1) ?? ""
}

export function joinPath(parts: string[]): string {
  if (parts.length === 0) return "/"
  return "/" + parts.join("/")
}

export function parentPath(folderPath: string): string | null {
  const parts = splitPath(folderPath)
  if (parts.length === 0) return null
  return joinPath(parts.slice(0, -1))
}

export function normalizeFolderPath(path: string): string {
  return joinPath(splitPath(path))
}
