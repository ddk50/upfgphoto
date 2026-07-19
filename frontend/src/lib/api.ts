import type { EffectiveAccess, Exif, FolderNode, Photo, TagSummary } from "@/types"

// ETL 直後など画像未添付の写真に使うプレースホルダ
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">' +
      '<rect width="400" height="400" fill="#e5e7eb"/>' +
      '<g fill="none" stroke="#9ca3af" stroke-width="8">' +
      '<circle cx="150" cy="150" r="35"/>' +
      '<path d="M40 330 L150 220 L230 300 L290 240 L360 310"/>' +
      "</g></svg>",
  )

export class ApiError extends Error {
  status: number

  constructor(status: number) {
    super(`API error: ${status}`)
    this.status = status
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "same-origin", ...init })
  if (!res.ok) throw new ApiError(res.status)
  return res.json() as Promise<T>
}

// ---- API raw types --------------------------------------------------------

export type Me =
  | { csrf: string; status: "anonymous" }
  | {
      csrf: string
      id: number
      name: string
      nickname: string
      avatar_url: string | null
      role: "admin" | "user"
      status: "approved" | "pending"
      expired: boolean
    }

type ApiPhoto = {
  id: number
  title: string
  folder_path: string
  file_name: string
  path: string
  taken_at: string
  tags: string[]
  exif: Exif | null
  uploader: { id: number; name: string; avatar_url: string | null }
  is_mine: boolean
  can_delete: boolean
  urls: { small: string; large: string; original: string } | null
}

type ApiGuestPhoto = {
  id: number
  title: string
  file_name: string
  taken_at: string
  urls: { small: string; large: string; original: string } | null
}

type ApiChild = {
  name: string
  path: string
  photo_count: number
  cover_url: string | null
  mode: "everyone" | "restricted" | "guest"
  owner: { id: number; name: string; avatar_url: string | null } | null
  is_mine_owner: boolean
}

type ApiFolderView = {
  path: string
  name: string
  breadcrumb: string[]
  folders: ApiChild[]
  photos: ApiPhoto[]
  access: { mode: string; source: string; member_ids?: number[]; share_token?: string | null }
  owner: { id: number; name: string; avatar_url: string | null } | null
  is_owner: boolean
  can_edit_access: boolean
  edit_blocker: { folder_path: string; owner_name: string | null } | null
}

// ---- adapted types (既存コンポーネントが使う形) ---------------------------

export type AdaptedPhoto = Photo & { isMine: boolean; canDelete: boolean }

export type ChildInfo = {
  mode: "everyone" | "restricted" | "guest"
  ownerName: string | null
  ownerAvatarUrl: string | null
  isMineOwner: boolean
}

export type FolderView = {
  path: string
  name: string
  breadcrumb: string[]
  folders: FolderNode[]
  childInfo: Record<string, ChildInfo>
  photos: AdaptedPhoto[]
  access: EffectiveAccess
  ownerName: string | null
  ownerAvatarUrl: string | null
  isOwner: boolean
  canEditAccess: boolean
  editBlocker: { folderPath: string; ownerName: string | null } | null
}

export type SearchResult = {
  folders: FolderNode[]
  photos: AdaptedPhoto[]
}

export type GuestFolderView = {
  rootPath: string
  rootName: string
  sub: string
  name: string
  folders: { name: string; sub: string; photoCount: number; coverUrl: string | null }[]
  photos: AdaptedPhoto[]
}

// ---- adapters -------------------------------------------------------------

function adaptPhoto(p: ApiPhoto): AdaptedPhoto {
  return {
    id: String(p.id),
    uploaderId: String(p.uploader.id),
    url: p.urls?.large ?? p.urls?.original ?? PLACEHOLDER_IMAGE,
    thumbnailUrl: p.urls?.small ?? PLACEHOLDER_IMAGE,
    path: p.path,
    title: p.title,
    takenAt: p.taken_at,
    width: 0,
    height: 0,
    exif: p.exif ?? undefined,
    tags: p.tags,
    isMine: p.is_mine,
    canDelete: p.can_delete,
  }
}

function adaptGuestPhoto(p: ApiGuestPhoto): AdaptedPhoto {
  return {
    id: String(p.id),
    uploaderId: "guest_anonymous",
    url: p.urls?.large ?? p.urls?.original ?? PLACEHOLDER_IMAGE,
    thumbnailUrl: p.urls?.small ?? PLACEHOLDER_IMAGE,
    path: p.file_name,
    title: p.title,
    takenAt: p.taken_at,
    width: 0,
    height: 0,
    isMine: false,
    canDelete: false,
  }
}

function childToNode(c: { name: string; path: string; photo_count: number; cover_url?: string | null }): FolderNode {
  return {
    name: c.name,
    path: c.path,
    children: [],
    photos: [],
    descendantPhotoCount: c.photo_count,
    coverPhoto: c.cover_url
      ? {
          id: `cover:${c.path}`,
          uploaderId: "",
          url: c.cover_url,
          thumbnailUrl: c.cover_url,
          path: c.path,
          title: c.name,
          takenAt: "",
          width: 0,
          height: 0,
        }
      : undefined,
  }
}

function adaptAccess(a: ApiFolderView["access"]): EffectiveAccess {
  if (a.mode === "restricted") {
    return {
      mode: "restricted",
      source: a.source,
      allowedUserIds: (a.member_ids ?? []).map(String),
    }
  }
  if (a.mode === "guest") {
    return { mode: "guest", source: a.source, allowedUserIds: [], shareToken: a.share_token ?? "" }
  }
  return { mode: "everyone", source: a.source, allowedUserIds: [] }
}

function adaptFolderView(v: ApiFolderView): FolderView {
  const childInfo: Record<string, ChildInfo> = {}
  for (const c of v.folders) {
    childInfo[c.path] = {
      mode: c.mode,
      ownerName: c.owner?.name ?? null,
      ownerAvatarUrl: c.owner?.avatar_url ?? null,
      isMineOwner: c.is_mine_owner,
    }
  }
  return {
    path: v.path,
    name: v.name,
    breadcrumb: v.breadcrumb,
    folders: v.folders.map(childToNode),
    childInfo,
    photos: v.photos.map(adaptPhoto),
    access: adaptAccess(v.access),
    ownerName: v.owner?.name ?? null,
    ownerAvatarUrl: v.owner?.avatar_url ?? null,
    isOwner: v.is_owner,
    canEditAccess: v.can_edit_access,
    editBlocker: v.edit_blocker
      ? { folderPath: v.edit_blocker.folder_path, ownerName: v.edit_blocker.owner_name }
      : null,
  }
}

// ---- endpoints ------------------------------------------------------------

export const api = {
  me(): Promise<Me> {
    return req<Me>("/api/v1/me")
  },

  async devLogin(userId: number): Promise<void> {
    const res = await fetch("/dev/login", {
      method: "POST",
      credentials: "same-origin",
      body: new URLSearchParams({ user_id: String(userId) }),
    })
    if (!res.ok) throw new ApiError(res.status)
  },

  async logout(): Promise<void> {
    await fetch("/logout", { method: "DELETE", credentials: "same-origin" })
  },

  async folder(path: string): Promise<FolderView> {
    const raw = await req<ApiFolderView>(`/api/v1/folders?path=${encodeURIComponent(path)}`)
    return adaptFolderView(raw)
  },

  async search(params: { q?: string; tags?: string[]; owned?: boolean }): Promise<SearchResult> {
    const qs = new URLSearchParams()
    if (params.q) qs.set("q", params.q)
    if (params.tags?.length) qs.set("tags", params.tags.join(","))
    if (params.owned) qs.set("owned", "me")
    const raw = await req<{
      folders: { name: string; path: string; photo_count: number }[]
      photos: ApiPhoto[]
    }>(`/api/v1/search?${qs.toString()}`)
    return {
      folders: raw.folders.map(childToNode),
      photos: raw.photos.map(adaptPhoto),
    }
  },

  async tags(): Promise<TagSummary[]> {
    const raw = await req<{ tags: TagSummary[] }>("/api/v1/tags")
    return raw.tags
  },

  async guestFolder(token: string, sub: string): Promise<GuestFolderView> {
    const qs = sub ? `?sub=${encodeURIComponent(sub)}` : ""
    const raw = await req<{
      root_path: string
      root_name: string
      sub: string
      name: string
      folders: { name: string; sub: string; photo_count: number; cover_url: string | null }[]
      photos: ApiGuestPhoto[]
    }>(`/api/v1/g/${token}${qs}`)
    return {
      rootPath: raw.root_path,
      rootName: raw.root_name,
      sub: raw.sub,
      name: raw.name,
      folders: raw.folders.map((f) => ({
        name: f.name,
        sub: f.sub,
        photoCount: f.photo_count,
        coverUrl: f.cover_url,
      })),
      photos: raw.photos.map(adaptGuestPhoto),
    }
  },

  async guestUpload(token: string, sub: string, files: File[]): Promise<void> {
    const body = new FormData()
    files.forEach((f) => body.append("files[]", f))
    if (sub) body.append("sub", sub)
    const res = await fetch(`/api/v1/g/${token}/photos`, {
      method: "POST",
      credentials: "same-origin",
      body,
    })
    if (!res.ok) throw new ApiError(res.status)
  },
}
