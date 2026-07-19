import { Link2 } from "lucide-react"
import type { Photo } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export type UploaderAvatarInfo = { avatarUrl: string; name: string } | "guest"

type PhotoTileProps = {
  photo: Photo
  onClick: () => void
  shareIndicator?: boolean
  uploaderAvatar?: UploaderAvatarInfo
  selectable?: boolean
  selected?: boolean
  onSelectChange?: (selected: boolean) => void
}

export function PhotoTile({
  photo,
  onClick,
  shareIndicator,
  uploaderAvatar,
  selectable,
  selected,
  onSelectChange,
}: PhotoTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-md bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selectable && selected && "ring-2 ring-primary",
      )}
      aria-label={photo.title}
    >
      <img
        src={photo.thumbnailUrl}
        alt={photo.title}
        loading="lazy"
        className={cn(
          "size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]",
          selectable && selected && "scale-[0.96] opacity-90",
        )}
      />

      {selectable && (
        <span
          className="absolute left-1.5 top-1.5 inline-flex items-center justify-center rounded-md bg-white/85 p-0.5 shadow"
          onClick={(e) => {
            e.stopPropagation()
            onSelectChange?.(!selected)
          }}
        >
          <Checkbox
            checked={!!selected}
            onCheckedChange={(v) => onSelectChange?.(v === true)}
            className="size-4"
          />
        </span>
      )}

      {shareIndicator && (
        <span
          className="absolute right-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded-full bg-white/90 text-blue-700 shadow ring-1 ring-blue-200"
          title="リンクで共有中のフォルダ"
        >
          <Link2 className="size-3.5" />
        </span>
      )}

      {uploaderAvatar && (
        <span className="absolute bottom-1.5 right-1.5">
          {uploaderAvatar === "guest" ? (
            <span
              className="inline-flex size-5 items-center justify-center rounded-full bg-blue-500/90 text-white ring-1 ring-white/80 shadow"
              title="ゲストがアップロード"
            >
              <Link2 className="size-3" />
            </span>
          ) : (
            <img
              src={uploaderAvatar.avatarUrl}
              alt={uploaderAvatar.name}
              title={`${uploaderAvatar.name} がアップロード`}
              className="size-5 rounded-full object-cover ring-1 ring-white/80 shadow"
            />
          )}
        </span>
      )}
    </button>
  )
}
