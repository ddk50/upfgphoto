export type Exif = {
  camera?: string
  lens?: string
  focalLength?: string
  aperture?: string
  shutter?: string
  iso?: number
}

export type Photo = {
  id: string
  uploaderId: string
  url: string
  thumbnailUrl: string
  path: string
  title: string
  takenAt: string
  width: number
  height: number
  exif?: Exif
  tags?: string[]
}

export type TagSummary = {
  name: string
  count: number
}

export type UserRole = "admin" | "user" | "guest"

export type ViewAsRole = UserRole | "pending"

export type UserStatus = "approved" | "pending"

export type User = {
  id: string
  email: string
  name: string
  avatarUrl: string
  role: UserRole
  banned?: boolean
  joinedAt: string
  expiresAt?: string | null
  status: UserStatus
}

export type AccessRule =
  | { mode: "inherit" }
  | { mode: "everyone" }
  | { mode: "restricted"; allowedUserIds: string[] }
  | { mode: "guest"; shareToken: string }

export type AccessRuleMap = Record<string, AccessRule>

export type EffectiveAccessMode = "everyone" | "restricted" | "guest"

export type EffectiveAccess =
  | { mode: "everyone"; source: string; allowedUserIds: [] }
  | { mode: "restricted"; source: string; allowedUserIds: string[] }
  | { mode: "guest"; source: string; allowedUserIds: []; shareToken: string }

// 共有URL台帳: 停止で AccessRule が消えてもエントリは残す（監査用）
export type ShareHistoryEntry = {
  token: string
  path: string
  issuedByName: string
  issuedAt: string
  stoppedAt?: string
  stoppedByName?: string
  stoppedReason?: "manual" | "parent-override"
}

export type FolderOwnerMap = Record<string, string>

export type StorageInfo = {
  totalBytes: number
  usedBytes: number
}

export type FolderNode = {
  name: string
  path: string
  children: FolderNode[]
  photos: Photo[]
  descendantPhotoCount: number
  coverPhoto?: Photo
}
