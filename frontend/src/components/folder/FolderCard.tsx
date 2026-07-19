import { Link } from "react-router-dom"
import type { EffectiveAccess, FolderNode } from "@/types"
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"
import { AccessBadge } from "@/components/access/AccessBadge"
import { FolderCoverStack } from "./FolderCoverStack"
import type { ChildInfo } from "@/lib/api"
import { cn } from "@/lib/utils"

type FolderCardProps = {
  folder: FolderNode
  // API 接続ページから渡される実データ。未指定時は mock Context にフォールバック (移行期間)
  info?: ChildInfo
}

export function FolderCard({ folder, info }: FolderCardProps) {
  const linkPath = `/folders${folder.path === "/" ? "" : folder.path}`
  const { resolveAccess, getFolderOwner, isOwner } = usePhotoLibrary()

  let access: EffectiveAccess
  let ownsThis: boolean
  let ownerName: string
  let ownerAvatarUrl: string | null
  if (info) {
    access =
      info.mode === "restricted"
        ? { mode: "restricted", source: folder.path, allowedUserIds: [] }
        : info.mode === "guest"
          ? { mode: "guest", source: folder.path, allowedUserIds: [], shareToken: "" }
          : { mode: "everyone", source: folder.path, allowedUserIds: [] }
    ownsThis = info.isMineOwner || info.ownerName === null
    ownerName = info.ownerName ?? ""
    ownerAvatarUrl = info.ownerAvatarUrl
  } else {
    access = resolveAccess(folder.path)
    const owner = getFolderOwner(folder.path)
    ownsThis = isOwner(folder.path)
    ownerName = owner.name
    ownerAvatarUrl = owner.avatarUrl
  }

  const isGuestShared = access.mode === "guest"
  const isRestricted = access.mode === "restricted"

  return (
    <Link
      to={linkPath}
      className="group flex flex-col gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
    >
      <FolderCoverStack
        coverPhoto={folder.coverPhoto}
        name={folder.name}
        className={cn(
          isGuestShared && "ring-2 ring-blue-400/80 ring-offset-2 ring-offset-background",
        )}
      >
        {isGuestShared && (
          <div className="absolute inset-x-2 bottom-2">
            <AccessBadge access={access} variant="pill" className="shadow-sm" />
          </div>
        )}
        {isRestricted && (
          <div className="absolute right-2 top-2">
            <AccessBadge access={access} size="sm" />
          </div>
        )}
        {!ownsThis && ownerAvatarUrl && (
          <img
            src={ownerAvatarUrl}
            alt={ownerName}
            title={`${ownerName} のフォルダ`}
            className={cn(
              "absolute size-5 rounded-full object-cover ring-1 ring-white/80 shadow",
              // guest 共有時は下端をバッジpillが使うので右上に退避 (restricted バッジとは排他)
              isGuestShared ? "right-2 top-2" : "bottom-2 right-2",
            )}
          />
        )}
      </FolderCoverStack>
      <div className="flex items-baseline justify-between px-1">
        <span className="truncate text-sm font-medium">{folder.name || "ライブラリ"}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {folder.descendantPhotoCount}
        </span>
      </div>
    </Link>
  )
}
