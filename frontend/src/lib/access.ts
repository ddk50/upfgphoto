import type {
  AccessRule,
  AccessRuleMap,
  EffectiveAccess,
  FolderOwnerMap,
  User,
  UserRole,
} from "@/types"
import { dirParts, joinPath, splitPath } from "@/lib/path"

const DEFAULT_ROOT: EffectiveAccess = {
  mode: "everyone",
  source: "/",
  allowedUserIds: [],
}

export function resolveAccess(folderPath: string, ruleMap: AccessRuleMap): EffectiveAccess {
  const parts = splitPath(folderPath)
  const ancestors = ["/", ...parts.map((_, i) => "/" + parts.slice(0, i + 1).join("/"))]
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const p = ancestors[i]
    const rule = ruleMap[p]
    if (!rule || rule.mode === "inherit") continue
    if (rule.mode === "everyone") {
      return { mode: "everyone", source: p, allowedUserIds: [] }
    }
    if (rule.mode === "restricted") {
      return { mode: "restricted", source: p, allowedUserIds: rule.allowedUserIds }
    }
    return { mode: "guest", source: p, allowedUserIds: [], shareToken: rule.shareToken }
  }
  return DEFAULT_ROOT
}

export function getOwnRule(folderPath: string, ruleMap: AccessRuleMap): AccessRule {
  return ruleMap[folderPath] ?? { mode: "inherit" }
}

export function isFolderRestricted(folderPath: string, ruleMap: AccessRuleMap): boolean {
  return resolveAccess(folderPath, ruleMap).mode === "restricted"
}

export function getFolderOwnerId(
  folderPath: string,
  ownerMap: FolderOwnerMap,
  defaultOwnerId: string,
): string {
  return ownerMap[folderPath] ?? defaultOwnerId
}

export function isOwner(
  folderPath: string,
  ownerMap: FolderOwnerMap,
  defaultOwnerId: string,
  userId: string,
): boolean {
  return getFolderOwnerId(folderPath, ownerMap, defaultOwnerId) === userId
}

function ancestorChain(folderPath: string): string[] {
  const parts = splitPath(folderPath)
  return ["/", ...parts.map((_, i) => "/" + parts.slice(0, i + 1).join("/"))]
}

/**
 * folderPath 自身を含む祖先のうち、restricted ルールが乗っているパスを返す。
 * 隷属判定の基礎: このうち1つでも他人所有なら、そのフォルダの公開設定はロックされる。
 */
export function findRestrictedAncestorSources(
  folderPath: string,
  ruleMap: AccessRuleMap,
): string[] {
  return ancestorChain(folderPath).filter((p) => ruleMap[p]?.mode === "restricted")
}

/**
 * 公開設定の編集権。子は他人の restricted に無条件で隷属する:
 * - admin: 常に可 / guest: 常に不可
 * - 祖先(自身含む)に他人所有の restricted が1つでもあれば不可
 *   （間に everyone 等の上書きがあっても解除されない）
 * - restricted 祖先が全て自分所有なら可（自分のゾーン内は子で上書きできる）
 * - restricted 祖先がなければ従来通りフォルダのオーナーのみ可
 */
export function canEditAccess(
  folderPath: string,
  role: UserRole,
  ownerMap: FolderOwnerMap,
  defaultOwnerId: string,
  userId: string,
  ruleMap: AccessRuleMap,
): boolean {
  if (role === "admin") return true
  if (role === "guest") return false
  const restrictedSources = findRestrictedAncestorSources(folderPath, ruleMap)
  const foreign = restrictedSources.filter(
    (p) => getFolderOwnerId(p, ownerMap, defaultOwnerId) !== userId,
  )
  if (foreign.length > 0) return false
  if (restrictedSources.length > 0) return true
  return isOwner(folderPath, ownerMap, defaultOwnerId, userId)
}

export function getPhotoEffectiveAccess(
  photoPath: string,
  ruleMap: AccessRuleMap,
): EffectiveAccess {
  const parentFolder = joinPath(dirParts(photoPath))
  return resolveAccess(parentFolder, ruleMap)
}

export function isExpired(user: Pick<User, "expiresAt">, now: Date = new Date()): boolean {
  if (!user.expiresAt) return false
  return new Date(user.expiresAt).getTime() < now.getTime()
}

export function isLoginBlocked(user: User, now: Date = new Date()): boolean {
  return !!user.banned || isExpired(user, now)
}

export function findDescendantRules(
  folderPath: string,
  ruleMap: AccessRuleMap,
): { path: string; rule: AccessRule }[] {
  const prefix = folderPath === "/" ? "/" : folderPath + "/"
  const results: { path: string; rule: AccessRule }[] = []
  for (const [path, rule] of Object.entries(ruleMap)) {
    if (path === folderPath) continue
    if (rule.mode === "inherit") continue
    if (folderPath === "/" || path.startsWith(prefix)) {
      results.push({ path, rule })
    }
  }
  return results.sort((a, b) => a.path.localeCompare(b.path))
}

export function buildTokenIndex(ruleMap: AccessRuleMap): Map<string, string> {
  const map = new Map<string, string>()
  for (const [path, rule] of Object.entries(ruleMap)) {
    if (rule.mode === "guest") {
      map.set(rule.shareToken, path)
    }
  }
  return map
}
