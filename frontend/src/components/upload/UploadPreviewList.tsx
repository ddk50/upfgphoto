import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export type PreviewItem = {
  id: string
  file: File
  previewUrl: string
}

type UploadPreviewListProps = {
  items: PreviewItem[]
  onRemove: (id: string) => void
}

export function UploadPreviewList({ items, onRemove }: UploadPreviewListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        まだ写真が選択されていません
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">{items.length} 枚選択中</div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {items.map((item) => (
          <li key={item.id} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
            <img
              src={item.previewUrl}
              alt={item.file.name}
              className="size-full object-cover"
            />
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onRemove(item.id)}
              aria-label="削除"
              className="absolute right-1.5 top-1.5 size-7 rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
            >
              <X className="size-3.5" />
            </Button>
            <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[11px] text-white">
              {item.file.name}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
