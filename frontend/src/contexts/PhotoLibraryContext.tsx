import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type {
  AccessRule,
  AccessRuleMap,
  EffectiveAccess,
  FolderNode,
  FolderOwnerMap,
  Photo,
  ShareHistoryEntry,
  StorageInfo,
  User,
  UserRole,
  ViewAsRole,
} from "@/types"
import { MOCK_PHOTOS } from "@/mocks/photos"
import { MOCK_USERS, CURRENT_USER_ID, GUEST_UPLOADER_ID } from "@/mocks/users"
import { INITIAL_ACCESS_RULES } from "@/mocks/access"
import { INITIAL_SHARE_HISTORY } from "@/mocks/shareHistory"
import { INITIAL_FOLDER_OWNERS, DEFAULT_OWNER_ID } from "@/mocks/owners"
import { MOCK_STORAGE } from "@/mocks/storage"
import { buildTree, findNode, getBreadcrumb, listPhotosUnder } from "@/lib/tree"
import {
  buildTokenIndex,
  canEditAccess,
  findDescendantRules,
  findRestrictedAncestorSources,
  getFolderOwnerId,
  getOwnRule,
  getPhotoEffectiveAccess,
  isOwner,
  resolveAccess,
} from "@/lib/access"
import { dirParts, joinPath, splitPath } from "@/lib/path"

type AddUserInput = { email: string; name?: string }

type PhotoLibrary = {
  photos: Photo[]
  tree: FolderNode
  findNode: (path: string) => FolderNode | null
  getBreadcrumb: (path: string) => FolderNode[]
  listPhotosUnder: (node: FolderNode) => Photo[]
  getPhotoById: (id: string) => Photo | undefined
  myPhotos: Photo[]
  deletePhoto: (id: string) => void
  addPhotos: (photos: Photo[]) => void
  getUploader: (photo: Photo) => User | null
  isMyPhoto: (photo: Photo) => boolean
  canDeletePhoto: (photo: Photo) => boolean

  users: User[]
  currentUser: User
  getUserById: (id: string) => User | undefined

  viewAsRole: ViewAsRole
  setViewAsRole: (role: ViewAsRole) => void
  effectiveRole: UserRole
  banUser: (id: string) => void
  unbanUser: (id: string) => void
  addUser: (input: AddUserInput) => User
  approveUser: (id: string) => void
  rejectUser: (id: string) => void
  setUserExpiration: (id: string, expiresAt: string | null) => void
  pendingUsers: User[]
  activeUsers: User[]

  accessRules: AccessRuleMap
  setAccessRule: (folderPath: string, rule: AccessRule) => void
  resolveAccess: (folderPath: string) => EffectiveAccess
  getOwnRule: (folderPath: string) => AccessRule
  getPhotoEffectiveAccess: (photoPath: string) => EffectiveAccess
  findDescendantRules: (folderPath: string) => { path: string; rule: AccessRule }[]
  clearDescendantRules: (folderPath: string) => void
  resolveGuestPath: (token: string, splat: string) => string | null
  shareHistory: ShareHistoryEntry[]

  folderOwners: FolderOwnerMap
  getFolderOwner: (folderPath: string) => User
  isOwner: (folderPath: string) => boolean
  canEditAccess: (folderPath: string) => boolean
  /** 他人の restricted に隷属してロックされている場合、その源泉（最初の1つ）を返す */
  getAccessEditBlocker: (folderPath: string) => { path: string; owner: User } | null

  tokenToFolderPath: Map<string, string>

  storage: StorageInfo
}

const PhotoLibraryContext = createContext<PhotoLibrary | null>(null)

export function PhotoLibraryProvider({ children }: { children: ReactNode }) {
  const [accessRules, setAccessRules] = useState<AccessRuleMap>(INITIAL_ACCESS_RULES)
  const [shareHistory, setShareHistory] = useState<ShareHistoryEntry[]>(INITIAL_SHARE_HISTORY)
  const [folderOwners, setFolderOwners] = useState<FolderOwnerMap>(INITIAL_FOLDER_OWNERS)
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [viewAsRole, setViewAsRole] = useState<ViewAsRole>("user")
  const [photos, setPhotos] = useState<Photo[]>(MOCK_PHOTOS)

  const deletePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const addPhotos = useCallback(
    (newPhotos: Photo[]) => {
      // 新規に実体化されたフォルダに first-creator オーナーを記録する。
      // guest アップロードで生まれたフォルダは、最も近い既存祖先のオーナーに帰属させる
      const existingDirs = new Set<string>()
      for (const p of photos) {
        const parts = dirParts(p.path)
        for (let i = 1; i <= parts.length; i++) {
          existingDirs.add(joinPath(parts.slice(0, i)))
        }
      }
      setFolderOwners((prev) => {
        const next = { ...prev }
        const nearestOwner = (dir: string): string => {
          const parts = splitPath(dir)
          for (let i = parts.length - 1; i >= 1; i--) {
            const ancestor = joinPath(parts.slice(0, i))
            if (next[ancestor]) return next[ancestor]
          }
          return DEFAULT_OWNER_ID
        }
        for (const np of newPhotos) {
          const parts = dirParts(np.path)
          for (let i = 1; i <= parts.length; i++) {
            const dir = joinPath(parts.slice(0, i))
            if (existingDirs.has(dir) || next[dir]) continue
            existingDirs.add(dir)
            next[dir] =
              np.uploaderId === GUEST_UPLOADER_ID ? nearestOwner(dir) : np.uploaderId
          }
        }
        return next
      })
      setPhotos((prev) => [...prev, ...newPhotos])
    },
    [photos],
  )

  const banUser = useCallback((id: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, banned: true } : u)))
  }, [])

  const unbanUser = useCallback((id: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, banned: false } : u)))
  }, [])

  const setUserExpiration = useCallback((id: string, expiresAt: string | null) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, expiresAt } : u)))
  }, [])

  const addUser = useCallback((input: AddUserInput): User => {
    const email = input.email.trim().toLowerCase()
    const slug = email.split("@")[0].replace(/[^a-z0-9]/g, "_") || Math.random().toString(36).slice(2, 7)
    const id = `u_${slug}_${Math.random().toString(36).slice(2, 5)}`
    const newUser: User = {
      id,
      email,
      name: input.name?.trim() || email.split("@")[0],
      avatarUrl: `https://picsum.photos/seed/${id}/96/96`,
      role: "user",
      joinedAt: new Date().toISOString(),
      status: "pending",
    }
    setUsers((prev) => (prev.some((u) => u.email === email) ? prev : [...prev, newUser]))
    return newUser
  }, [])

  const approveUser = useCallback((id: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: "approved" } : u)))
  }, [])

  const rejectUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const tree = useMemo(() => buildTree(photos), [photos])
  const byPhotoId = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos])
  const byUserId = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])
  const currentUser = useMemo(
    () => byUserId.get(CURRENT_USER_ID) ?? users[0],
    [byUserId, users],
  )
  const tokenToFolderPath = useMemo(() => buildTokenIndex(accessRules), [accessRules])
  const pendingUsers = useMemo(() => users.filter((u) => u.status === "pending"), [users])
  const activeUsers = useMemo(() => users.filter((u) => u.status === "approved"), [users])
  const effectiveRole: UserRole = viewAsRole === "pending" ? "user" : viewAsRole
  const myPhotos = useMemo(
    () =>
      photos
        .filter((p) => p.uploaderId === currentUser.id)
        .sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1)),
    [photos, currentUser],
  )

  const ownerNameOf = useCallback(
    (path: string) => {
      const ownerId = getFolderOwnerId(path, folderOwners, DEFAULT_OWNER_ID)
      return byUserId.get(ownerId)?.name ?? currentUser.name
    },
    [byUserId, currentUser, folderOwners],
  )

  // 共有URLの発行・停止は AccessRule の変化から一元的に台帳へ記録する
  const setAccessRule = useCallback(
    (folderPath: string, rule: AccessRule) => {
      const prevRule = accessRules[folderPath]
      const prevToken = prevRule?.mode === "guest" ? prevRule.shareToken : null
      const nextToken = rule.mode === "guest" ? rule.shareToken : null
      if (prevToken !== nextToken) {
        const now = new Date().toISOString()
        const stopperName = currentUser.name
        const issuerName = ownerNameOf(folderPath)
        setShareHistory((h) => {
          let next = prevToken
            ? h.map((e) =>
                e.token === prevToken && !e.stoppedAt
                  ? { ...e, stoppedAt: now, stoppedByName: stopperName, stoppedReason: "manual" as const }
                  : e,
              )
            : h
          if (nextToken && !next.some((e) => e.token === nextToken)) {
            next = [
              ...next,
              { token: nextToken, path: folderPath, issuedByName: issuerName, issuedAt: now },
            ]
          }
          return next
        })
      }
      setAccessRules((prev) => {
        const next = { ...prev }
        if (rule.mode === "inherit") {
          delete next[folderPath]
        } else {
          next[folderPath] = rule
        }
        return next
      })
    },
    [accessRules, currentUser, ownerNameOf],
  )

  const clearDescendantRules = useCallback(
    (folderPath: string) => {
      const prefix = folderPath === "/" ? "/" : folderPath + "/"
      const removedTokens = Object.entries(accessRules).flatMap(([path, rule]) =>
        path !== folderPath &&
        (folderPath === "/" || path.startsWith(prefix)) &&
        rule.mode === "guest"
          ? [rule.shareToken]
          : [],
      )
      if (removedTokens.length > 0) {
        const now = new Date().toISOString()
        const stopperName = currentUser.name
        setShareHistory((h) =>
          h.map((e) =>
            removedTokens.includes(e.token) && !e.stoppedAt
              ? { ...e, stoppedAt: now, stoppedByName: stopperName, stoppedReason: "parent-override" as const }
              : e,
          ),
        )
      }
      setAccessRules((prev) => {
        const next: AccessRuleMap = {}
        for (const [path, rule] of Object.entries(prev)) {
          if (path === folderPath) {
            next[path] = rule
            continue
          }
          if (folderPath === "/" || path.startsWith(prefix)) continue
          next[path] = rule
        }
        return next
      })
    },
    [accessRules, currentUser],
  )

  const value = useMemo<PhotoLibrary>(() => {
    const getUploader = (photo: Photo): User | null => {
      if (photo.uploaderId === GUEST_UPLOADER_ID) return null
      return byUserId.get(photo.uploaderId) ?? null
    }
    const isMyPhoto = (photo: Photo) => photo.uploaderId === currentUser.id
    const canDeletePhoto = (photo: Photo) =>
      effectiveRole === "admin" || photo.uploaderId === currentUser.id

    return {
      photos,
      tree,
      findNode: (path) => findNode(tree, path),
      getBreadcrumb: (path) => getBreadcrumb(tree, path),
      listPhotosUnder: (node) => listPhotosUnder(node),
      getPhotoById: (id) => byPhotoId.get(id),
      myPhotos,
      deletePhoto,
      addPhotos,
      getUploader,
      isMyPhoto,
      canDeletePhoto,

      users,
      currentUser,
      getUserById: (id) => byUserId.get(id),

      viewAsRole,
      setViewAsRole,
      effectiveRole,
      banUser,
      unbanUser,
      addUser,
      approveUser,
      rejectUser,
      setUserExpiration,
      pendingUsers,
      activeUsers,

      accessRules,
      setAccessRule,
      resolveAccess: (path) => resolveAccess(path, accessRules),
      getOwnRule: (path) => getOwnRule(path, accessRules),
      getPhotoEffectiveAccess: (photoPath) => getPhotoEffectiveAccess(photoPath, accessRules),
      findDescendantRules: (path) => findDescendantRules(path, accessRules),
      clearDescendantRules,
      shareHistory,
      resolveGuestPath: (token, splat) => {
        const root = tokenToFolderPath.get(token)
        if (!root) return null
        const subParts = splitPath(splat || "")
        if (subParts.length === 0) return root
        const rootParts = splitPath(root)
        return joinPath([...rootParts, ...subParts])
      },

      folderOwners,
      getFolderOwner: (path) => {
        const ownerId = getFolderOwnerId(path, folderOwners, DEFAULT_OWNER_ID)
        return byUserId.get(ownerId) ?? currentUser
      },
      isOwner: (path) => isOwner(path, folderOwners, DEFAULT_OWNER_ID, currentUser.id),
      canEditAccess: (path) =>
        canEditAccess(path, effectiveRole, folderOwners, DEFAULT_OWNER_ID, currentUser.id, accessRules),
      getAccessEditBlocker: (path) => {
        if (effectiveRole === "admin") return null
        const foreign = findRestrictedAncestorSources(path, accessRules).filter(
          (p) => getFolderOwnerId(p, folderOwners, DEFAULT_OWNER_ID) !== currentUser.id,
        )
        if (foreign.length === 0) return null
        const sourcePath = foreign[0]
        const ownerId = getFolderOwnerId(sourcePath, folderOwners, DEFAULT_OWNER_ID)
        return { path: sourcePath, owner: byUserId.get(ownerId) ?? currentUser }
      },

      tokenToFolderPath,

      storage: MOCK_STORAGE,
    }
  }, [
    photos,
    tree,
    byPhotoId,
    byUserId,
    currentUser,
    users,
    viewAsRole,
    effectiveRole,
    pendingUsers,
    activeUsers,
    banUser,
    unbanUser,
    addUser,
    approveUser,
    rejectUser,
    setUserExpiration,
    accessRules,
    setAccessRule,
    clearDescendantRules,
    shareHistory,
    folderOwners,
    tokenToFolderPath,
    myPhotos,
    deletePhoto,
    addPhotos,
  ])

  return (
    <PhotoLibraryContext.Provider value={value}>
      {children}
    </PhotoLibraryContext.Provider>
  )
}

export function usePhotoLibrary(): PhotoLibrary {
  const ctx = useContext(PhotoLibraryContext)
  if (!ctx) throw new Error("usePhotoLibrary must be used within PhotoLibraryProvider")
  return ctx
}
