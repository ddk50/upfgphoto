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
  serverMessage?: string

  constructor(status: number, serverMessage?: string) {
    super(serverMessage || `API error: ${status}`)
    this.status = status
    this.serverMessage = serverMessage
  }
}

// エラーレスポンス { error: "..." } からユーザ向けメッセージを取り出す
async function serverError(res: Response): Promise<string | undefined> {
  try {
    return ((await res.json()) as { error?: string }).error
  } catch {
    return undefined
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
  description: string | null
  folder_path: string
  file_name: string
  path: string
  taken_at: string
  tags: string[]
  exif: Exif | null
  uploader: { id: number; name: string; avatar_url: string | null }
  is_mine: boolean
  can_delete: boolean
  effective_mode: "everyone" | "restricted" | "guest"
  urls: { small: string; large: string; original: string } | null
}

type ApiGuestPhoto = {
  id: number
  title: string
  description: string | null
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
    uploaderName: p.uploader.name,
    uploaderAvatarUrl: p.uploader.avatar_url,
    url: p.urls?.large ?? p.urls?.original ?? PLACEHOLDER_IMAGE,
    thumbnailUrl: p.urls?.small ?? PLACEHOLDER_IMAGE,
    path: p.path,
    title: p.title,
    description: p.description ?? undefined,
    takenAt: p.taken_at,
    width: 0,
    height: 0,
    exif: p.exif ?? undefined,
    tags: p.tags,
    isMine: p.is_mine,
    canDelete: p.can_delete,
    effectiveMode: p.effective_mode,
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
    description: p.description ?? undefined,
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

export type ApiUser = {
  id: number
  name: string
  nickname: string
  avatarUrl: string | null
}

export type AdminUser = ApiUser & {
  email: string | null
  role: "admin" | "user"
  banned: boolean
  expiresAt: string | null
  expired: boolean
  joinedAt: string
  providers: string[]
  isSelf: boolean
}

export type PendingUser = {
  id: number
  name: string
  nickname: string
  email: string | null
  googleEmail: string | null
  requestedAt: string
}

export type ShareLinkEntry = {
  token: string
  folderPath: string
  active: boolean
  own: boolean
  folderOwner: string | null
  issuedBy: string
  issuedAt: string
  revokedAt: string | null
  revokedBy: string | null
  revokedReason: "manual" | "parent-override" | null
}

export type AccessRuleView = {
  path: string
  effective: { mode: string; source: string; memberIds: number[] }
  parentEffective: { mode: string; source: string; memberIds: number[] } | null
  ownMode: "inherit" | "everyone" | "restricted" | "guest"
  ownMemberIds: number[]
  descendantRules: { path: string; mode: string }[]
  canEdit: boolean
  editBlocker: { folderPath: string; ownerName: string | null } | null
}

export type MyPhotosFolders = {
  total: number
  folders: { path: string; name: string; photoCount: number; coverUrl: string | null }[]
}

// FolderPicker 用: パス一覧から FolderNode ツリーを構築
export function buildFolderTree(
  folders: { path: string; photo_count: number }[],
): FolderNode {
  const root: FolderNode = {
    name: "",
    path: "/",
    children: [],
    photos: [],
    descendantPhotoCount: 0,
  }
  const nodeOf = new Map<string, FolderNode>([["/", root]])
  const sorted = [...folders].sort((a, b) => a.path.localeCompare(b.path, "ja"))
  for (const f of sorted) {
    if (f.path === "/") continue
    const segments = f.path.split("/").filter(Boolean)
    let parent = root
    let acc = ""
    for (const seg of segments) {
      acc += `/${seg}`
      let node = nodeOf.get(acc)
      if (!node) {
        node = { name: seg, path: acc, children: [], photos: [], descendantPhotoCount: 0 }
        parent.children.push(node)
        nodeOf.set(acc, node)
      }
      parent = node
    }
  }
  for (const f of sorted) {
    const segments = f.path.split("/").filter(Boolean)
    let acc = ""
    root.descendantPhotoCount += f.photo_count
    for (const seg of segments) {
      acc += `/${seg}`
      const node = nodeOf.get(acc)
      if (node) node.descendantPhotoCount += f.photo_count
    }
  }
  return root
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
    // DELETE /logout は CSRF 保護下にあるので、現セッションのトークンを取得して送る
    const me = await req<Me>("/api/v1/me")
    const res = await fetch("/logout", {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "X-CSRF-Token": me.csrf },
    })
    if (!res.ok) throw new ApiError(res.status)
  },

  async folder(path: string): Promise<FolderView> {
    const raw = await req<ApiFolderView>(`/api/v1/folders?path=${encodeURIComponent(path)}`)
    return adaptFolderView(raw)
  },

  async renameFolder(path: string, newName: string): Promise<{ path: string; name: string }> {
    const res = await fetch("/api/v1/folders", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, new_name: newName }),
    })
    if (!res.ok) throw new ApiError(res.status)
    return (await res.json()) as { path: string; name: string }
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
    if (!res.ok) throw new ApiError(res.status, await serverError(res))
  },

  async uploadPhotos(input: {
    files: File[]
    folderPath?: string
    tags?: string[]
  }): Promise<{ photos: AdaptedPhoto[]; folders: string[] }> {
    const body = new FormData()
    input.files.forEach((f) => body.append("files[]", f))
    if (input.folderPath) body.append("folder_path", input.folderPath)
    input.tags?.forEach((t) => body.append("tags[]", t))
    const res = await fetch("/api/v1/photos", {
      method: "POST",
      credentials: "same-origin",
      body,
    })
    if (!res.ok) throw new ApiError(res.status, await serverError(res))
    const raw = (await res.json()) as { photos: ApiPhoto[]; folders: string[] }
    return { photos: raw.photos.map(adaptPhoto), folders: raw.folders }
  },

  async deletePhoto(id: string): Promise<void> {
    const res = await fetch(`/api/v1/photos/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    })
    if (!res.ok) throw new ApiError(res.status)
  },

  async myPhotoFolders(): Promise<MyPhotosFolders> {
    const raw = await req<{
      total: number
      folders: { path: string; name: string; photo_count: number; cover_url: string | null }[]
    }>("/api/v1/my_photos")
    return {
      total: raw.total,
      folders: raw.folders.map((f) => ({
        path: f.path,
        name: f.name,
        photoCount: f.photo_count,
        coverUrl: f.cover_url,
      })),
    }
  },

  async myPhotosIn(path: string): Promise<AdaptedPhoto[]> {
    const raw = await req<{ photos: ApiPhoto[] }>(
      `/api/v1/my_photos?path=${encodeURIComponent(path)}`,
    )
    return raw.photos.map(adaptPhoto)
  },

  async stats(): Promise<{
    totalPhotos: number
    uploaders: { id: number; name: string; avatarUrl: string | null; count: number }[]
  }> {
    const raw = await req<{
      total_photos: number
      uploaders: { id: number; name: string; avatar_url: string | null; count: number }[]
    }>("/api/v1/stats")
    return {
      totalPhotos: raw.total_photos,
      uploaders: raw.uploaders.map((u) => ({
        id: u.id,
        name: u.name,
        avatarUrl: u.avatar_url,
        count: u.count,
      })),
    }
  },

  async storage(): Promise<{ totalBytes: number; usedBytes: number }> {
    const raw = await req<{ total_bytes: number; used_bytes: number }>("/api/v1/storage")
    return { totalBytes: raw.total_bytes, usedBytes: raw.used_bytes }
  },

  async users(): Promise<ApiUser[]> {
    const raw = await req<{ users: { id: number; name: string; nickname: string; avatar_url: string | null }[] }>(
      "/api/v1/users",
    )
    return raw.users.map((u) => ({
      id: u.id, name: u.name, nickname: u.nickname, avatarUrl: u.avatar_url,
    }))
  },

  async folderTree(): Promise<FolderNode> {
    const raw = await req<{ folders: { path: string; photo_count: number }[] }>(
      "/api/v1/folder_tree",
    )
    return buildFolderTree(raw.folders)
  },

  async shareLinks(): Promise<ShareLinkEntry[]> {
    const raw = await req<{
      share_links: {
        token: string
        folder_path: string
        active: boolean
        own: boolean
        folder_owner: string | null
        issued_by: string
        issued_at: string
        revoked_at: string | null
        revoked_by: string | null
        revoked_reason: "manual" | "parent-override" | null
      }[]
    }>("/api/v1/share_links")
    return raw.share_links.map((l) => ({
      token: l.token,
      folderPath: l.folder_path,
      active: l.active,
      own: l.own,
      folderOwner: l.folder_owner,
      issuedBy: l.issued_by,
      issuedAt: l.issued_at,
      revokedAt: l.revoked_at,
      revokedBy: l.revoked_by,
      revokedReason: l.revoked_reason,
    }))
  },

  async accessRule(path: string): Promise<AccessRuleView> {
    const raw = await req<{
      path: string
      effective: { mode: string; source: string; member_ids: number[] }
      parent_effective: { mode: string; source: string; member_ids: number[] } | null
      own_mode: "inherit" | "everyone" | "restricted" | "guest"
      own_member_ids: number[]
      descendant_rules: { path: string; mode: string }[]
      can_edit: boolean
      edit_blocker: { folder_path: string; owner_name: string | null } | null
    }>(`/api/v1/access_rules?path=${encodeURIComponent(path)}`)
    return {
      path: raw.path,
      effective: {
        mode: raw.effective.mode,
        source: raw.effective.source,
        memberIds: raw.effective.member_ids,
      },
      parentEffective: raw.parent_effective && {
        mode: raw.parent_effective.mode,
        source: raw.parent_effective.source,
        memberIds: raw.parent_effective.member_ids,
      },
      ownMode: raw.own_mode,
      ownMemberIds: raw.own_member_ids,
      descendantRules: raw.descendant_rules,
      canEdit: raw.can_edit,
      editBlocker: raw.edit_blocker && {
        folderPath: raw.edit_blocker.folder_path,
        ownerName: raw.edit_blocker.owner_name,
      },
    }
  },

  async saveAccessRule(input: {
    path: string
    mode: "inherit" | "everyone" | "restricted" | "guest"
    memberIds?: number[]
    clearDescendants?: boolean
  }): Promise<{ shareToken: string | null }> {
    const res = await fetch("/api/v1/access_rules", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: input.path,
        mode: input.mode,
        member_ids: input.memberIds ?? [],
        clear_descendants: input.clearDescendants ?? false,
      }),
    })
    if (!res.ok) throw new ApiError(res.status)
    const raw = (await res.json()) as { share_token: string | null }
    return { shareToken: raw.share_token }
  },

  async adminUsers(): Promise<AdminUser[]> {
    const raw = await req<{
      users: {
        id: number; name: string; nickname: string; email: string | null
        avatar_url: string | null; role: "admin" | "user"; banned: boolean
        expires_at: string | null; expired: boolean; joined_at: string
        providers: string[]; is_self: boolean
      }[]
    }>("/api/v1/admin/users")
    return raw.users.map((u) => ({
      id: u.id, name: u.name, nickname: u.nickname, avatarUrl: u.avatar_url,
      email: u.email, role: u.role, banned: u.banned, expiresAt: u.expires_at,
      expired: u.expired, joinedAt: u.joined_at, providers: u.providers, isSelf: u.is_self,
    }))
  },

  async updateAdminUser(
    id: number,
    attrs: { expiresAt?: string | null; banned?: boolean },
  ): Promise<void> {
    const body: Record<string, unknown> = {}
    if ("expiresAt" in attrs) body.expires_at = attrs.expiresAt
    if ("banned" in attrs) body.banned = attrs.banned
    const res = await fetch(`/api/v1/admin/users/${id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new ApiError(res.status)
  },

  async pendingUsers(): Promise<{ pending: PendingUser[]; linkCandidates: ApiUser[] }> {
    const raw = await req<{
      pending_users: {
        id: number; name: string; nickname: string; email: string | null
        google_email: string | null; requested_at: string
      }[]
      link_candidates: { id: number; name: string; nickname: string }[]
    }>("/api/v1/admin/pending_users")
    return {
      pending: raw.pending_users.map((u) => ({
        id: u.id, name: u.name, nickname: u.nickname, email: u.email,
        googleEmail: u.google_email, requestedAt: u.requested_at,
      })),
      linkCandidates: raw.link_candidates.map((u) => ({
        id: u.id, name: u.name, nickname: u.nickname, avatarUrl: null,
      })),
    }
  },

  async approvePendingUser(id: number): Promise<void> {
    const res = await fetch(`/api/v1/admin/pending_users/${id}/approve`, {
      method: "POST",
      credentials: "same-origin",
    })
    if (!res.ok) throw new ApiError(res.status)
  },

  async linkPendingUser(id: number, targetUserId: number): Promise<void> {
    const res = await fetch(`/api/v1/admin/pending_users/${id}/link`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_user_id: targetUserId }),
    })
    if (!res.ok) throw new ApiError(res.status)
  },

  async rejectPendingUser(id: number): Promise<void> {
    const res = await fetch(`/api/v1/admin/pending_users/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    })
    if (!res.ok) throw new ApiError(res.status)
  },

  async trash(): Promise<{ retentionDays: number; photos: TrashPhoto[] }> {
    const raw = await req<{
      retention_days: number
      photos: (ApiPhoto & { deleted_at: string; purge_deadline: string })[]
    }>("/api/v1/trash")
    return {
      retentionDays: raw.retention_days,
      photos: raw.photos.map((p) => ({
        ...adaptPhoto(p),
        deletedAt: p.deleted_at,
        purgeDeadline: p.purge_deadline,
      })),
    }
  },

  async restoreFromTrash(id: string): Promise<void> {
    const res = await fetch(`/api/v1/trash/${id}/restore`, {
      method: "POST",
      credentials: "same-origin",
    })
    if (!res.ok) throw new ApiError(res.status)
  },

  async purgeFromTrash(id: string): Promise<void> {
    const res = await fetch(`/api/v1/trash/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    })
    if (!res.ok) throw new ApiError(res.status)
  },
}

export type TrashPhoto = AdaptedPhoto & { deletedAt: string; purgeDeadline: string }
