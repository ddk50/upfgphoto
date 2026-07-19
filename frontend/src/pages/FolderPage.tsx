import { useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { Settings2, User as UserIcon } from "lucide-react"
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"
import { FolderBreadcrumb } from "@/components/folder/FolderBreadcrumb"
import { FolderGrid } from "@/components/folder/FolderGrid"
import { FolderShareBanner } from "@/components/folder/FolderShareBanner"
import { PhotoGrid } from "@/components/photo/PhotoGrid"
import { Lightbox } from "@/components/photo/Lightbox"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AccessBadge } from "@/components/access/AccessBadge"
import { AccessSettingsDialog } from "@/components/access/AccessSettingsDialog"
import { CreateFolderButton } from "@/components/folder/CreateFolderButton"
import { normalizeFolderPath } from "@/lib/path"
import { cn } from "@/lib/utils"

export function FolderPage() {
  const params = useParams()
  const folderPath = normalizeFolderPath("/" + (params["*"] ?? ""))
  const {
    findNode,
    getBreadcrumb,
    resolveAccess,
    getFolderOwner,
    isOwner,
    canEditAccess,
    getAccessEditBlocker,
    viewAsRole,
    isMyPhoto,
  } = usePhotoLibrary()
  const node = findNode(folderPath)
  const [searchParams, setSearchParams] = useSearchParams()
  const ownedFilter = searchParams.get("owned") === "me"

  const allPhotos = useMemo(() => node?.photos ?? [], [node])
  const mineCount = useMemo(() => allPhotos.filter((p) => isMyPhoto(p)).length, [allPhotos, isMyPhoto])
  const photos = useMemo(
    () => (ownedFilter ? allPhotos.filter((p) => isMyPhoto(p)) : allPhotos),
    [allPhotos, ownedFilter, isMyPhoto],
  )

  const toggleOwned = () => {
    const params = new URLSearchParams(searchParams)
    if (ownedFilter) params.delete("owned")
    else params.set("owned", "me")
    setSearchParams(params, { replace: true })
  }
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [accessDialog, setAccessDialog] = useState<{ open: boolean; path: string }>({
    open: false,
    path: folderPath,
  })

  if (!node) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">フォルダが見つかりません</h1>
        <p className="text-sm text-muted-foreground">パス: {folderPath}</p>
      </div>
    )
  }

  const trail = getBreadcrumb(folderPath)
  const hasChildren = node.children.length > 0
  const hasPhotos = allPhotos.length > 0
  const access = resolveAccess(folderPath)
  const owner = getFolderOwner(folderPath)
  const ownsThis = isOwner(folderPath)
  const canEdit = canEditAccess(folderPath)
  const editBlocker = getAccessEditBlocker(folderPath)
  const isAdmin = viewAsRole === "admin"
  const editingAsAdminElseOwner = isAdmin && !ownsThis

  const openDialog = (path: string) => setAccessDialog({ open: true, path })

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <FolderBreadcrumb trail={trail} />
        {access.mode === "guest" && (
          <FolderShareBanner
            folderPath={folderPath}
            access={access}
            onOpenSettings={() => openDialog(access.source)}
          />
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{node.name}</h1>
              <AccessBadge access={access} variant="pill" showWhenPublic />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>
                {node.descendantPhotoCount} 枚の写真
                {hasChildren && ` ・ ${node.children.length} サブフォルダ`}
              </span>
              {!ownsThis && (
                <span className="inline-flex items-center gap-1.5">
                  <span>オーナー:</span>
                  <img
                    src={owner.avatarUrl}
                    alt={owner.name}
                    className="size-5 rounded-full object-cover"
                  />
                  <span className="text-foreground">{owner.name}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CreateFolderButton parentPath={folderPath} />
            <AccessButton
              canEdit={canEdit}
              isAdminEditingOthers={editingAsAdminElseOwner}
              disabledReason={
                editBlocker
                  ? `このフォルダは ${editBlocker.path}（オーナー: ${editBlocker.owner.name}）の限定公開設定に従属しています`
                  : "オーナーまたは管理者のみ変更可能です"
              }
              onClick={() => openDialog(folderPath)}
            />
          </div>
        </div>
      </header>

      {hasChildren && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">フォルダ</h2>
          <FolderGrid folders={node.children} />
        </section>
      )}

      {hasChildren && hasPhotos && <Separator />}

      {hasPhotos && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">写真</h2>
            {mineCount > 0 && mineCount < allPhotos.length && (
              <button
                type="button"
                onClick={toggleOwned}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                  ownedFilter
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-foreground/30 hover:bg-muted",
                )}
              >
                <UserIcon className="size-3.5" />
                自分のだけ ({mineCount})
              </button>
            )}
          </div>
          <PhotoGrid
            photos={photos}
            onSelect={(_p, i) => setLightboxIndex(i)}
            showUploaderBadges
          />
        </section>
      )}

      {!hasChildren && !hasPhotos && (
        <p className="text-sm text-muted-foreground">このフォルダには何もありません。</p>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}

      <AccessSettingsDialog
        open={accessDialog.open}
        onOpenChange={(o) => setAccessDialog((s) => ({ ...s, open: o }))}
        folderPath={accessDialog.path}
      />
    </div>
  )
}

function AccessButton({
  canEdit,
  isAdminEditingOthers,
  disabledReason,
  onClick,
}: {
  canEdit: boolean
  isAdminEditingOthers: boolean
  disabledReason: string
  onClick: () => void
}) {
  if (!canEdit) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button variant="outline" size="sm" disabled>
              <Settings2 className="size-4" />
              公開設定
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    )
  }
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        isAdminEditingOthers && "border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800",
      )}
    >
      <Settings2 className="size-4" />
      {isAdminEditingOthers ? "公開設定（管理者）" : "公開設定"}
    </Button>
  )
}
