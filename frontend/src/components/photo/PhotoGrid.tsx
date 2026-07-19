import type { Photo } from "@/types"
import { PhotoTile, type UploaderAvatarInfo } from "./PhotoTile"
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"

type PhotoGridProps = {
  photos: Photo[]
  onSelect: (photo: Photo, index: number) => void
  showShareIndicators?: boolean
  showUploaderBadges?: boolean
  selectionMode?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (next: Set<string>) => void
}

export function PhotoGrid({
  photos,
  onSelect,
  showShareIndicators,
  showUploaderBadges,
  selectionMode,
  selectedIds,
  onSelectionChange,
}: PhotoGridProps) {
  const { getPhotoEffectiveAccess, getUploader, isMyPhoto } = usePhotoLibrary()
  if (photos.length === 0) return null

  const toggle = (id: string) => {
    if (!onSelectionChange) return
    const next = new Set(selectedIds ?? [])
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 xl:grid-cols-5">
      {photos.map((photo, i) => {
        const shared =
          showShareIndicators && getPhotoEffectiveAccess(photo.path).mode === "guest"

        let uploaderAvatar: UploaderAvatarInfo | undefined
        if (showUploaderBadges && !isMyPhoto(photo)) {
          const uploader = getUploader(photo)
          uploaderAvatar = uploader
            ? { avatarUrl: uploader.avatarUrl, name: uploader.name }
            : "guest"
        }

        const selected = selectedIds?.has(photo.id) ?? false

        return (
          <PhotoTile
            key={photo.id}
            photo={photo}
            shareIndicator={shared}
            uploaderAvatar={uploaderAvatar}
            selectable={selectionMode}
            selected={selected}
            onSelectChange={() => toggle(photo.id)}
            onClick={() => {
              if (selectionMode) toggle(photo.id)
              else onSelect(photo, i)
            }}
          />
        )
      })}
    </div>
  )
}
