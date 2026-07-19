import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  CheckSquare,
  FolderOpen,
  ImageUp,
  Loader2,
  Square,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PhotoGrid } from "@/components/photo/PhotoGrid"
import { Lightbox } from "@/components/photo/Lightbox"
import { FolderCoverStack } from "@/components/folder/FolderCoverStack"
import { api, type AdaptedPhoto, type MyPhotosFolders } from "@/lib/api"
import { normalizeFolderPath, parentPath } from "@/lib/path"
import type { Photo } from "@/types"

export function MyPhotosPage() {
  const splat = useParams()["*"] ?? ""
  if (!splat) return <MyPhotosIndex />
  return <MyPhotosFolder folderPath={normalizeFolderPath("/" + splat)} />
}

function MyPhotosIndex() {
  const [view, setView] = useState<MyPhotosFolders | null>(null)

  useEffect(() => {
    void api.myPhotoFolders().then(setView).catch(() => setView({ total: 0, folders: [] }))
  }, [])

  if (!view) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">マイフォト</h1>
        <p className="text-sm text-muted-foreground">
          あなたがアップロードした写真 {view.total} 枚 ・ {view.folders.length} フォルダ
        </p>
      </header>

      {view.folders.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {view.folders.map((g) => {
            const parent = parentPath(g.path)
            return (
              <Link
                key={g.path}
                to={`/my-photos${g.path === "/" ? "" : g.path}`}
                className="group flex flex-col gap-2 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <FolderCoverStack
                  coverPhoto={g.coverUrl ? coverPhotoOf(g.path, g.name, g.coverUrl) : undefined}
                  name={g.name || "ライブラリ"}
                />
                <div className="space-y-0.5 px-1">
                  <div className="flex items-baseline justify-between">
                    <span className="truncate text-sm font-medium">{g.name || "ライブラリ"}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {g.photoCount}
                    </span>
                  </div>
                  {parent && parent !== "/" && (
                    <p className="truncate text-xs text-muted-foreground">{parent}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">まだ自分の写真がありません。</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/upload">
              <ImageUp className="size-4" />
              写真をアップロード
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function coverPhotoOf(path: string, name: string, coverUrl: string): Photo {
  return {
    id: `cover:${path}`,
    uploaderId: "",
    url: coverUrl,
    thumbnailUrl: coverUrl,
    path,
    title: name,
    takenAt: "",
    width: 0,
    height: 0,
  }
}

function MyPhotosFolder({ folderPath }: { folderPath: string }) {
  const [photos, setPhotos] = useState<AdaptedPhoto[] | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      setPhotos(await api.myPhotosIn(folderPath))
    } catch {
      setPhotos([])
    }
  }, [folderPath])

  useEffect(() => {
    void load()
  }, [load])

  const folderName = folderPath.split("/").filter(Boolean).at(-1) ?? "ライブラリ"
  const folderLink = `/folders${folderPath === "/" ? "" : folderPath}`
  const selectedCount = selectedIds.size

  if (!photos) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  const handleToggleSelectionMode = () => {
    setSelectionMode((m) => {
      if (m) setSelectedIds(new Set())
      return !m
    })
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    const ids = Array.from(selectedIds)
    try {
      await Promise.all(ids.map((id) => api.deletePhoto(id)))
      toast.success(`${ids.length}枚をゴミ箱に移動しました`, {
        description: "ゴミ箱から復元できます",
      })
    } catch {
      toast.error("一部の削除に失敗しました")
    } finally {
      setDeleting(false)
      setSelectedIds(new Set())
      setSelectionMode(false)
      setConfirmOpen(false)
      void load()
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          to="/my-photos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          マイフォト
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{folderName}</h1>
            <p className="text-sm text-muted-foreground">
              このフォルダのあなたの写真 {photos.length} 枚
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={folderLink}>
                <FolderOpen className="size-4" />
                フォルダを開く
              </Link>
            </Button>
            {photos.length > 0 && (
              <Button
                variant={selectionMode ? "secondary" : "outline"}
                size="sm"
                onClick={handleToggleSelectionMode}
              >
                {selectionMode ? (
                  <>
                    <X className="size-4" />
                    キャンセル
                  </>
                ) : (
                  <>
                    <CheckSquare className="size-4" />
                    選択モード
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {selectionMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium tabular-nums">{selectedCount} 枚を選択中</span>
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                解除
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set(photos.map((p) => p.id)))}
            >
              <Square className="size-4" />
              すべて選択
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={selectedCount === 0}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-4" />
              {selectedCount > 0 ? `${selectedCount}枚を削除` : "削除"}
            </Button>
          </div>
        </div>
      )}

      {photos.length > 0 ? (
        <PhotoGrid
          photos={photos}
          showShareIndicators
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onSelect={(_p, i) => setLightboxIndex(i)}
        />
      ) : (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            このフォルダにあなたの写真はもうありません。
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/my-photos">
              <ArrowLeft className="size-4" />
              マイフォトに戻る
            </Link>
          </Button>
        </div>
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedCount}枚の写真を削除しますか？</DialogTitle>
            <DialogDescription>ゴミ箱に移動します。しばらくの間は復元できます。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={() => void handleConfirmDelete()}>
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
