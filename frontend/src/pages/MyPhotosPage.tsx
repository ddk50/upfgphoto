import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  CheckSquare,
  FolderOpen,
  ImageUp,
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
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"
import { groupPhotosByFolder } from "@/lib/tree"
import { dirParts, joinPath, normalizeFolderPath, parentPath, splitPath } from "@/lib/path"

export function MyPhotosPage() {
  const splat = useParams()["*"] ?? ""
  if (!splat) return <MyPhotosIndex />
  return <MyPhotosFolder folderPath={normalizeFolderPath("/" + splat)} />
}

function MyPhotosIndex() {
  const { myPhotos } = usePhotoLibrary()
  const groups = useMemo(() => groupPhotosByFolder(myPhotos), [myPhotos])

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">マイフォト</h1>
        <p className="text-sm text-muted-foreground">
          あなたがアップロードした写真 {myPhotos.length} 枚 ・ {groups.length} フォルダ
        </p>
      </header>

      {groups.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {groups.map((g) => {
            const parent = parentPath(g.path)
            return (
              <Link
                key={g.path}
                to={`/my-photos${g.path === "/" ? "" : g.path}`}
                className="group flex flex-col gap-2 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <FolderCoverStack coverPhoto={g.photos[0]} name={g.name || "ライブラリ"} />
                <div className="space-y-0.5 px-1">
                  <div className="flex items-baseline justify-between">
                    <span className="truncate text-sm font-medium">{g.name || "ライブラリ"}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {g.photos.length}
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

function MyPhotosFolder({ folderPath }: { folderPath: string }) {
  const { myPhotos, deletePhoto } = usePhotoLibrary()
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const photos = useMemo(
    () =>
      myPhotos
        .filter((p) => joinPath(dirParts(p.path)) === folderPath)
        .sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1)),
    [myPhotos, folderPath],
  )
  const folderName = splitPath(folderPath).at(-1) ?? "ライブラリ"
  const folderLink = `/folders${folderPath === "/" ? "" : folderPath}`
  const selectedCount = selectedIds.size

  const handleToggleSelectionMode = () => {
    setSelectionMode((m) => {
      if (m) setSelectedIds(new Set())
      return !m
    })
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(photos.map((p) => p.id)))
  }

  const handleClearSelection = () => setSelectedIds(new Set())

  const handleConfirmDelete = () => {
    const ids = Array.from(selectedIds)
    ids.forEach((id) => deletePhoto(id))
    toast.success(`${ids.length}枚を削除しました`, {
      description: "モックなのでリロードで元に戻ります",
    })
    setSelectedIds(new Set())
    setSelectionMode(false)
    setConfirmOpen(false)
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
                onClick={handleClearSelection}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                解除
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
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
        />
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedCount}枚の写真を削除しますか？</DialogTitle>
            <DialogDescription>
              モックなのでリロードすると元に戻ります。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              <Trash2 className="size-4" />
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
