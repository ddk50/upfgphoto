import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { ChevronRight, ImageUp, Link2, Loader2, ShieldAlert, X } from "lucide-react"
import { PhotoGrid } from "@/components/photo/PhotoGrid"
import { PhotoListView } from "@/components/photo/PhotoListView"
import { PhotoViewToggle } from "@/components/photo/PhotoViewToggle"
import { usePhotoView } from "@/hooks/usePhotoView"
import { sortPhotos, type PhotoSort } from "@/lib/photoSort"
import { Lightbox } from "@/components/photo/Lightbox"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FolderCoverStack } from "@/components/folder/FolderCoverStack"
import { Dropzone } from "@/components/upload/Dropzone"
import {
  UploadPreviewList,
  type PreviewItem,
} from "@/components/upload/UploadPreviewList"
import { api, ApiError, PLACEHOLDER_IMAGE, type GuestFolderView } from "@/lib/api"
import type { Photo } from "@/types"

export function GuestFolderPage() {
  const { token } = useParams()
  const splat = useParams()["*"] ?? ""
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState<GuestFolderView | null>(null)
  const [status, setStatus] = useState<"loading" | "ok" | "invalid">("loading")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [photoView, setPhotoView] = usePhotoView()
  const [photoSort, setPhotoSort] = useState<PhotoSort>(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    if (!token) {
      setStatus("invalid")
      return
    }
    try {
      setView(await api.guestFolder(token, splat))
      setStatus("ok")
    } catch {
      setView(null)
      setStatus("invalid")
    }
  }, [token, splat])

  useEffect(() => {
    setStatus("loading")
    void load()
  }, [load])

  const isUploadModalOpen = searchParams.get("upload") === "1"
  const openUpload = () => {
    const params = new URLSearchParams(searchParams)
    params.set("upload", "1")
    setSearchParams(params)
  }
  const closeUpload = () => {
    const params = new URLSearchParams(searchParams)
    params.delete("upload")
    setSearchParams(params)
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  if (status === "invalid" || !view || !token) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">リンクが無効です</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          このフォルダは共有が解除されたか、URL が間違っている可能性があります。
        </p>
      </div>
    )
  }

  const subParts = view.sub ? view.sub.split("/") : []
  const breadcrumb = [
    { label: "共有ルート", to: `/g/${token}` },
    ...subParts.map((part, i) => ({
      label: part,
      to: `/g/${token}/${subParts.slice(0, i + 1).join("/")}`,
    })),
  ]
  const isAtRoot = subParts.length === 0
  const hasChildren = view.folders.length > 0
  const hasPhotos = view.photos.length > 0
  const totalCount = view.photos.length + view.folders.reduce((s, f) => s + f.photoCount, 0)
  // リスト表示のソートはライトボックスの前後移動にも効かせる
  const displayPhotos = photoView === "list" ? sortPhotos(view.photos, photoSort) : view.photos

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <nav aria-label="パンくず" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {breadcrumb.map((b, i) => {
            const isLast = i === breadcrumb.length - 1
            return (
              <span key={b.to} className="contents">
                {isLast ? (
                  <span className="text-foreground">{b.label}</span>
                ) : (
                  <Link to={b.to} className="hover:text-foreground hover:underline">
                    {b.label}
                  </Link>
                )}
                {!isLast && <ChevronRight className="size-3.5 shrink-0" />}
              </span>
            )
          })}
        </nav>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <Link2 className="size-4" />
            </div>
            <div className="space-y-1 text-sm text-blue-900">
              <p className="font-medium">このフォルダはリンクを知っている全員が閲覧・アップロード可能です</p>
              <p className="text-xs text-blue-800/80">
                {isAtRoot
                  ? <>共有フォルダ: <span className="font-mono">{view.rootName}</span></>
                  : <>共有フォルダ <span className="font-mono">{view.rootName}</span> 配下のサブフォルダです</>}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {view.name || "共有フォルダ"}
            </h1>
            <p className="text-sm text-muted-foreground">{totalCount} 枚の写真</p>
          </div>
          <div className="flex items-center gap-2">
            <PhotoViewToggle view={photoView} onChange={setPhotoView} />
            <Button onClick={openUpload}>
              <ImageUp className="size-4" />
              写真を追加
            </Button>
          </div>
        </div>
      </header>

      {photoView === "list" ? (
        (hasChildren || hasPhotos) && (
          <section className="space-y-4">
            <PhotoListView
              folders={view.folders.map((child) => ({
                name: child.name,
                path: child.sub,
                children: [],
                photos: [],
                descendantPhotoCount: child.photoCount,
              }))}
              onOpenFolder={(sub) => navigate(`/g/${token}/${sub}`)}
              photos={displayPhotos}
              onSelect={(_p, i) => setLightboxIndex(i)}
              sort={photoSort}
              onSortChange={setPhotoSort}
            />
          </section>
        )
      ) : (
        <>
          {hasChildren && (
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">サブフォルダ</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                {view.folders.map((child) => (
                  <Link
                    key={child.sub}
                    to={`/g/${token}/${child.sub}`}
                    className="group flex flex-col gap-2 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <FolderCoverStack
                      coverPhoto={
                        child.coverUrl
                          ? coverPhotoOf(child.sub, child.name, child.coverUrl)
                          : undefined
                      }
                      name={child.name}
                    />
                    <div className="flex items-baseline justify-between px-1 text-sm">
                      <span className="truncate font-medium">{child.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {child.photoCount}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {hasChildren && hasPhotos && <Separator />}

          {hasPhotos && (
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">写真</h2>
              <PhotoGrid photos={view.photos} onSelect={(_p, i) => setLightboxIndex(i)} />
            </section>
          )}
        </>
      )}

      {!hasPhotos && !hasChildren && (
        <p className="text-sm text-muted-foreground">このフォルダにはまだ写真がありません。</p>
      )}

      {lightboxIndex !== null && displayPhotos[lightboxIndex] && (
        <Lightbox
          photos={displayPhotos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}

      <GuestUploadDialog
        open={isUploadModalOpen}
        onClose={closeUpload}
        token={token}
        sub={view.sub}
        displayPath={view.name || view.rootName}
        onUploaded={() => {
          closeUpload()
          void load()
        }}
      />
    </div>
  )
}

function coverPhotoOf(sub: string, name: string, coverUrl: string): Photo {
  return {
    id: `cover:${sub}`,
    uploaderId: "",
    url: coverUrl || PLACEHOLDER_IMAGE,
    thumbnailUrl: coverUrl || PLACEHOLDER_IMAGE,
    path: sub,
    title: name,
    takenAt: "",
    width: 0,
    height: 0,
  }
}

function GuestUploadDialog({
  open,
  onClose,
  token,
  sub,
  displayPath,
  onUploaded,
}: {
  open: boolean
  onClose: () => void
  token: string
  sub: string
  displayPath: string
  onUploaded: () => void
}) {
  const [items, setItems] = useState<PreviewItem[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!open) {
      items.forEach((it) => URL.revokeObjectURL(it.previewUrl))
      setItems([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleDrop = (files: File[]) => {
    const next: PreviewItem[] = files.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setItems((prev) => [...prev, ...next])
  }

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  const handleUpload = async () => {
    setUploading(true)
    try {
      await api.guestUpload(token, sub, items.map((it) => it.file))
      toast.success(`${items.length} 枚をアップロードしました`)
      setItems([])
      onUploaded()
    } catch (e) {
      toast.error(
        e instanceof ApiError && e.serverMessage ? e.serverMessage : "アップロードに失敗しました",
      )
    } finally {
      setUploading(false)
    }
  }

  const canUpload = items.length > 0 && !uploading

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>写真を追加</DialogTitle>
          <DialogDescription>
            保存先: <span className="font-mono text-xs">{displayPath}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Dropzone onDrop={handleDrop} />
          <UploadPreviewList items={items} onRemove={handleRemove} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            <X className="size-4" />
            キャンセル
          </Button>
          <Button disabled={!canUpload} onClick={() => void handleUpload()}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
            アップロード
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
