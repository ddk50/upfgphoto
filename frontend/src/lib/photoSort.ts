import type { Photo } from "@/types"

// リスト表示の列ソート。null = サーバの返却順 (従来挙動)
export type PhotoSortKey = "title" | "takenAt"
export type PhotoSort = { key: PhotoSortKey; dir: "asc" | "desc" } | null

export function sortPhotos(photos: Photo[], sort: PhotoSort): Photo[] {
  if (!sort) return photos
  const sign = sort.dir === "asc" ? 1 : -1
  return [...photos].sort((a, b) => {
    if (sort.key === "title") return sign * a.title.localeCompare(b.title, "ja")
    return sign * (new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime())
  })
}

// 同じ列なら昇降を反転、別の列なら昇順から
export function nextSort(current: PhotoSort, key: PhotoSortKey): PhotoSort {
  if (current?.key === key) {
    return { key, dir: current.dir === "asc" ? "desc" : "asc" }
  }
  return { key, dir: "asc" }
}
