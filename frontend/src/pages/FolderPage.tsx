import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { Check, Copy, Link2, Loader2, Settings2, User as UserIcon } from "lucide-react"
import { FolderBreadcrumb } from "@/components/folder/FolderBreadcrumb"
import { FolderGrid } from "@/components/folder/FolderGrid"
import { PhotoGrid } from "@/components/photo/PhotoGrid"
import { Lightbox } from "@/components/photo/Lightbox"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AccessBadge } from "@/components/access/AccessBadge"
import { AccessSettingsDialog } from "@/components/access/AccessSettingsDialog"
import { CreateFolderButton } from "@/components/folder/CreateFolderButton"
import { useSession } from "@/contexts/SessionContext"
import { api, ApiError, type FolderView } from "@/lib/api"
import { normalizeFolderPath } from "@/lib/path"
import type { FolderNode } from "@/types"
import { cn } from "@/lib/utils"

export function FolderPage() {
  const params = useParams()
  const folderPath = normalizeFolderPath("/" + (params["*"] ?? ""))
  const { isAdmin } = useSession()
  const [view, setView] = useState<FolderView | null>(null)
  const [status, setStatus] = useState<"loading" | "ok" | "not-found">("loading")
  const [searchParams, setSearchParams] = useSearchParams()
  const ownedFilter = searchParams.get("owned") === "me"
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [accessDialogOpen, setAccessDialogOpen] = useState(false)

  const load = useCallback(async () => {
    setStatus("loading")
    try {
      setView(await api.folder(folderPath))
      setStatus("ok")
    } catch (e) {
      setView(null)
      setStatus(e instanceof ApiError && e.status === 404 ? "not-found" : "not-found")
    }
  }, [folderPath])

  useEffect(() => {
    void load()
  }, [load])

  const allPhotos = view?.photos ?? []
  const mineCount = useMemo(() => allPhotos.filter((p) => p.isMine).length, [allPhotos])
  const photos = useMemo(
    () => (ownedFilter ? allPhotos.filter((p) => p.isMine) : allPhotos),
    [allPhotos, ownedFilter],
  )

  const toggleOwned = () => {
    const next = new URLSearchParams(searchParams)
    if (ownedFilter) next.delete("owned")
    else next.set("owned", "me")
    setSearchParams(next, { replace: true })
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  if (status === "not-found" || !view) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">フォルダが見つかりません</h1>
        <p className="text-sm text-muted-foreground">
          パス: {folderPath}（存在しないか、閲覧権限がありません）
        </p>
      </div>
    )
  }

  const trail: FolderNode[] = view.breadcrumb.map((p) => ({
    name: p.split("/").filter(Boolean).at(-1) ?? "",
    path: p,
    children: [],
    photos: [],
    descendantPhotoCount: 0,
  }))
  const hasChildren = view.folders.length > 0
  const hasPhotos = allPhotos.length > 0
  const shareToken = view.access.mode === "guest" ? view.access.shareToken : null

  const handleCopyShareUrl = async () => {
    if (!shareToken) return
    await navigator.clipboard.writeText(`${window.location.origin}/g/${shareToken}`)
    setCopied(true)
    toast.success("共有URLをコピーしました")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <FolderBreadcrumb trail={trail} />
        {shareToken && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <Link2 className="size-4" />
              このフォルダはリンクを知っている全員が閲覧できます
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyShareUrl}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              URLをコピー
            </Button>
          </div>
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {view.name || "ライブラリ"}
              </h1>
              <AccessBadge access={view.access} variant="pill" showWhenPublic />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>
                {allPhotos.length} 枚の写真
                {hasChildren && ` ・ ${view.folders.length} サブフォルダ`}
              </span>
              {!view.isOwner && view.ownerName && (
                <span className="inline-flex items-center gap-1.5">
                  <span>オーナー:</span>
                  {view.ownerAvatarUrl && (
                    <img
                      src={view.ownerAvatarUrl}
                      alt={view.ownerName}
                      className="size-5 rounded-full object-cover"
                    />
                  )}
                  <span className="text-foreground">{view.ownerName}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CreateFolderButton parentPath={folderPath} />
            <AccessButton
              canEdit={view.canEditAccess}
              isAdminEditingOthers={isAdmin && !view.isOwner}
              disabledReason={
                view.editBlocker
                  ? `このフォルダは ${view.editBlocker.folderPath}（オーナー: ${view.editBlocker.ownerName ?? "不明"}）の限定公開設定に従属しています`
                  : "オーナーまたは管理者のみ変更可能です"
              }
              onClick={() => setAccessDialogOpen(true)}
            />
          </div>
        </div>
      </header>

      {hasChildren && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">フォルダ</h2>
          <FolderGrid folders={view.folders} info={view.childInfo} />
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
          <PhotoGrid photos={photos} onSelect={(_p, i) => setLightboxIndex(i)} />
        </section>
      )}

      {!hasChildren && !hasPhotos && (
        <p className="text-sm text-muted-foreground">このフォルダには何もありません。</p>
      )}

      {lightboxIndex !== null && photos[lightboxIndex] && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          onDeleted={() => void load()}
        />
      )}

      <AccessSettingsDialog
        open={accessDialogOpen}
        onOpenChange={setAccessDialogOpen}
        folderPath={folderPath}
        isOwner={view.isOwner}
        onSaved={() => void load()}
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
