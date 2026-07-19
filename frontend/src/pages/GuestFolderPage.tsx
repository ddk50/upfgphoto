import { useEffect, useMemo, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { ChevronRight, ImageUp, Link2, ShieldAlert, X } from "lucide-react"
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"
import { PhotoGrid } from "@/components/photo/PhotoGrid"
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
import { GUEST_UPLOADER_ID } from "@/mocks/users"
import type { Photo } from "@/types"
import { joinPath, splitPath } from "@/lib/path"

export function GuestFolderPage() {
  const { token } = useParams()
  const splat = useParams()["*"] ?? ""
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    tokenToFolderPath,
    findNode,
    addPhotos,
    accessRules,
  } = usePhotoLibrary()

  const rootFolderPath = token ? tokenToFolderPath.get(token) : undefined
  const folderPath = useMemo(() => {
    if (!rootFolderPath) return null
    const rootParts = splitPath(rootFolderPath)
    const subParts = splitPath(splat)
    return joinPath([...rootParts, ...subParts])
  }, [rootFolderPath, splat])

  const node = folderPath ? findNode(folderPath) : null
  const photos = useMemo(() => node?.photos ?? [], [node])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

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

  if (!token || !rootFolderPath || !folderPath || !node) {
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

  // breadcrumb: 共有ルート / sub1 / sub2 ...
  const subParts = splitPath(splat)
  const breadcrumb = [
    { label: "共有ルート", to: `/g/${token}`, name: rootFolderPath },
    ...subParts.map((part, i) => ({
      label: part,
      to: `/g/${token}/${subParts.slice(0, i + 1).join("/")}`,
      name: joinPath([...splitPath(rootFolderPath), ...subParts.slice(0, i + 1)]),
    })),
  ]
  const isAtRoot = subParts.length === 0
  const accessSource = accessRules[rootFolderPath]
  const shareToken = accessSource?.mode === "guest" ? accessSource.shareToken : token

  const hasChildren = node.children.length > 0
  const hasPhotos = photos.length > 0

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
                  ? <>共有ルート: <span className="font-mono">{rootFolderPath}</span></>
                  : <>共有ルート <span className="font-mono">{rootFolderPath}</span> 配下のサブフォルダです</>}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{node.name || "共有フォルダ"}</h1>
            <p className="text-sm text-muted-foreground">{node.descendantPhotoCount} 枚の写真</p>
          </div>
          <Button onClick={openUpload}>
            <ImageUp className="size-4" />
            写真を追加
          </Button>
        </div>
      </header>

      {hasChildren && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">サブフォルダ</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {node.children.map((child) => {
              const childSplat = [...subParts, child.name].join("/")
              return (
                <Link
                  key={child.path}
                  to={`/g/${token}/${childSplat}`}
                  className="group flex flex-col gap-2 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <FolderCoverStack coverPhoto={child.coverPhoto} name={child.name} />
                  <div className="flex items-baseline justify-between px-1 text-sm">
                    <span className="truncate font-medium">{child.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {child.descendantPhotoCount}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {hasChildren && hasPhotos && <Separator />}

      {hasPhotos && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">写真</h2>
          <PhotoGrid photos={photos} onSelect={(_p, i) => setLightboxIndex(i)} />
        </section>
      )}

      {!hasPhotos && !hasChildren && (
        <p className="text-sm text-muted-foreground">このフォルダにはまだ写真がありません。</p>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}

      <GuestUploadDialog
        open={isUploadModalOpen}
        onClose={closeUpload}
        token={token}
        folderPath={folderPath}
        rootFolderPath={rootFolderPath}
        shareToken={shareToken ?? token}
        onUploadComplete={(newPhotos) => {
          addPhotos(newPhotos)
          closeUpload()
        }}
      />
    </div>
  )
}

function GuestUploadDialog({
  open,
  onClose,
  folderPath,
  onUploadComplete,
}: {
  open: boolean
  onClose: () => void
  token: string
  folderPath: string
  rootFolderPath: string
  shareToken: string
  onUploadComplete: (photos: Photo[]) => void
}) {
  const [items, setItems] = useState<PreviewItem[]>([])

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

  const handleUpload = () => {
    const now = new Date().toISOString()
    const basePath = folderPath === "/" ? "" : folderPath
    const newPhotos: Photo[] = items.map((it) => ({
      id: `upload_${Math.random().toString(36).slice(2, 10)}`,
      uploaderId: GUEST_UPLOADER_ID,
      url: it.previewUrl,
      thumbnailUrl: it.previewUrl,
      path: `${basePath}/${it.file.name}`,
      title: it.file.name,
      takenAt: now,
      width: 0,
      height: 0,
    }))
    onUploadComplete(newPhotos)
    toast.success(`${items.length} 枚をアップロードしました`)
    setItems([])
  }

  const canUpload = items.length > 0

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>写真を追加</DialogTitle>
          <DialogDescription>
            保存先: <span className="font-mono text-xs">{folderPath}</span>
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
          <Button disabled={!canUpload} onClick={handleUpload}>
            <ImageUp className="size-4" />
            アップロード
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

