import type { FolderNode, Photo } from "@/types"
import { dirParts, joinPath, splitPath } from "@/lib/path"

function newNode(name: string, path: string): FolderNode {
  return {
    name,
    path,
    children: [],
    photos: [],
    descendantPhotoCount: 0,
    coverPhoto: undefined,
  }
}

export function buildTree(photos: Photo[]): FolderNode {
  const root = newNode("", "/")

  for (const photo of photos) {
    const parts = dirParts(photo.path)
    let node = root
    for (let i = 0; i < parts.length; i++) {
      const segName = parts[i]
      let child = node.children.find((c) => c.name === segName)
      if (!child) {
        child = newNode(segName, joinPath(parts.slice(0, i + 1)))
        node.children.push(child)
      }
      node = child
    }
    node.photos.push(photo)
  }

  sortAndAggregate(root)
  return root
}

function sortAndAggregate(node: FolderNode): { count: number; cover?: Photo } {
  node.children.sort((a, b) => a.name.localeCompare(b.name, "ja"))
  node.photos.sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1))

  let count = node.photos.length
  let cover: Photo | undefined = node.photos[0]

  for (const child of node.children) {
    const result = sortAndAggregate(child)
    count += result.count
    if (!cover && result.cover) cover = result.cover
  }

  node.descendantPhotoCount = count
  node.coverPhoto = cover
  return { count, cover }
}

export function findNode(root: FolderNode, path: string): FolderNode | null {
  const parts = splitPath(path)
  let node: FolderNode | undefined = root
  for (const part of parts) {
    node = node?.children.find((c) => c.name === part)
    if (!node) return null
  }
  return node ?? null
}

export function getBreadcrumb(root: FolderNode, path: string): FolderNode[] {
  const parts = splitPath(path)
  const trail: FolderNode[] = [root]
  let node: FolderNode | undefined = root
  for (const part of parts) {
    node = node?.children.find((c) => c.name === part)
    if (!node) break
    trail.push(node)
  }
  return trail
}

export type FolderPhotoGroup = {
  path: string
  name: string
  photos: Photo[]
}

export function groupPhotosByFolder(photos: Photo[]): FolderPhotoGroup[] {
  const groups = new Map<string, Photo[]>()
  for (const p of photos) {
    const dir = joinPath(dirParts(p.path))
    const list = groups.get(dir)
    if (list) list.push(p)
    else groups.set(dir, [p])
  }
  return Array.from(groups.entries())
    .map(([path, list]) => ({
      path,
      name: splitPath(path).at(-1) ?? "",
      photos: list.sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1)),
    }))
    .sort((a, b) => (a.photos[0].takenAt < b.photos[0].takenAt ? 1 : -1))
}

export function listPhotosUnder(node: FolderNode): Photo[] {
  const acc: Photo[] = [...node.photos]
  for (const child of node.children) {
    acc.push(...listPhotosUnder(child))
  }
  return acc.sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1))
}
