import { useState } from "react"
import { useSwipeable } from "react-swipeable"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Info, Link2, Trash2, X } from "lucide-react"
import type { Photo } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { PhotoMetaPanel } from "./PhotoMetaPanel"
import { useKeyboard } from "@/hooks/useKeyboard"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"
import { cn } from "@/lib/utils"

type LightboxProps = {
  photos: Photo[]
  index: number
  onClose: () => void
  onIndexChange: (i: number) => void
}

export function Lightbox({ photos, index, onClose, onIndexChange }: LightboxProps) {
  const [metaOpen, setMetaOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 640px)")
  const { getPhotoEffectiveAccess, canDeletePhoto, isMyPhoto, deletePhoto } = usePhotoLibrary()
  const photo = photos[index]
  const isShared = photo ? getPhotoEffectiveAccess(photo.path).mode === "guest" : false
  const canDelete = photo ? canDeletePhoto(photo) : false
  const adminOverride = photo ? canDelete && !isMyPhoto(photo) : false
  const hasPrev = index > 0
  const hasNext = index < photos.length - 1

  const prev = () => hasPrev && onIndexChange(index - 1)
  const next = () => hasNext && onIndexChange(index + 1)

  useKeyboard({
    ArrowLeft: prev,
    ArrowRight: next,
    Escape: onClose,
  })

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => next(),
    onSwipedRight: () => prev(),
    trackTouch: true,
    trackMouse: false,
    delta: 40,
  })

  if (!photo) return null

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="!max-w-none w-screen h-svh p-0 gap-0 border-0 bg-black/95 sm:rounded-none"
        >
          <DialogTitle className="sr-only">{photo.title}</DialogTitle>
          <DialogDescription className="sr-only">写真ビューア</DialogDescription>

          <div
            {...swipeHandlers}
            className="relative flex size-full items-center justify-center select-none"
          >
            <img
              src={photo.url}
              alt={photo.title}
              className="max-h-full max-w-full object-contain"
              draggable={false}
            />

            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 bg-gradient-to-b from-black/60 to-transparent p-3 sm:p-5">
              <div className="pointer-events-auto min-w-0 text-white">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm sm:text-base font-medium">{photo.title}</span>
                  {isShared && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-500/90 px-2 py-0.5 text-[11px] font-medium text-white">
                      <Link2 className="size-3" />
                      リンク共有中
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-white/70">
                  {index + 1} / {photos.length}
                </div>
              </div>
              <div className="pointer-events-auto flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/15 hover:text-white"
                  onClick={() => setMetaOpen(true)}
                  aria-label="情報を見る"
                >
                  <Info className="size-5" />
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "text-white hover:bg-white/15 hover:text-white",
                      adminOverride && "text-red-300 hover:text-red-200",
                    )}
                    onClick={() => setConfirmDeleteOpen(true)}
                    aria-label={adminOverride ? "管理者として削除" : "削除"}
                    title={adminOverride ? "管理者として削除" : "削除"}
                  >
                    <Trash2 className="size-5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/15 hover:text-white"
                  onClick={onClose}
                  aria-label="閉じる"
                >
                  <X className="size-5" />
                </Button>
              </div>
            </div>

            {hasPrev && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 sm:left-4 z-10 hidden text-white hover:bg-white/15 hover:text-white sm:inline-flex h-12 w-12"
                onClick={prev}
                aria-label="前の写真"
              >
                <ChevronLeft className="size-7" />
              </Button>
            )}
            {hasNext && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 sm:right-4 z-10 hidden text-white hover:bg-white/15 hover:text-white sm:inline-flex h-12 w-12"
                onClick={next}
                aria-label="次の写真"
              >
                <ChevronRight className="size-7" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={metaOpen} onOpenChange={setMetaOpen}>
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          className={isDesktop ? "w-96 max-w-full" : "max-h-[85svh]"}
        >
          <SheetHeader>
            <SheetTitle>写真の情報</SheetTitle>
            <SheetDescription className="sr-only">写真のメタ情報とEXIF</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <PhotoMetaPanel photo={photo} />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{adminOverride ? "管理者として削除しますか？" : "写真を削除しますか？"}</DialogTitle>
            <DialogDescription>
              {adminOverride
                ? `「${photo.title}」を削除します。モックなのでリロードで元に戻ります。`
                : `「${photo.title}」を削除します。モックなのでリロードで元に戻ります。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deletePhoto(photo.id)
                toast.success(adminOverride ? "管理者として削除しました" : "削除しました", {
                  description: "モックなのでリロードで元に戻ります",
                })
                setConfirmDeleteOpen(false)
                if (photos.length <= 1) {
                  onClose()
                } else if (hasNext) {
                  onIndexChange(index)
                } else {
                  onIndexChange(index - 1)
                }
              }}
            >
              <Trash2 className="size-4" />
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
