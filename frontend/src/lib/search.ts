import type { FolderNode, Photo, TagSummary } from "@/types"
import { fileName } from "@/lib/path"

export function summarizeTags(photos: Photo[]): TagSummary[] {
  const counts = new Map<string, number>()
  for (const p of photos) {
    for (const t of p.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja"))
}

export function filterPhotosByTags(photos: Photo[], tags: string[]): Photo[] {
  if (tags.length === 0) return photos
  return photos.filter((p) => {
    const set = new Set(p.tags ?? [])
    return tags.every((t) => set.has(t))
  })
}

export type SearchCriteria = {
  query?: string
  tags?: string[]
}

export function searchPhotos(photos: Photo[], criteria: SearchCriteria): Photo[] {
  const q = criteria.query?.trim().toLowerCase() ?? ""
  const tags = criteria.tags ?? []
  if (!q && tags.length === 0) return photos

  const byTags = filterPhotosByTags(photos, tags)
  if (!q) return byTags

  return byTags.filter((p) => matchesQuery(p, q))
}

function matchesQuery(photo: Photo, q: string): boolean {
  if (photo.title.toLowerCase().includes(q)) return true
  // ディレクトリ部分はフォルダ検索 (searchFolders) に代表させ、写真はファイル名のみ見る
  if (fileName(photo.path).toLowerCase().includes(q)) return true
  if ((photo.tags ?? []).some((t) => t.toLowerCase().includes(q))) return true
  return false
}

export function searchFolders(root: FolderNode, query: string): FolderNode[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const matched: FolderNode[] = []
  const visit = (node: FolderNode) => {
    if (node !== root && node.name.toLowerCase().includes(q)) matched.push(node)
    for (const child of node.children) visit(child)
  }
  visit(root)
  return matched
}

export function parseTagsParam(value: string | null): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export function serializeTagsParam(tags: string[]): string {
  return tags.join(",")
}
