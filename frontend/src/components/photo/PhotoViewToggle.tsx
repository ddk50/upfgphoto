import { LayoutGrid, List } from "lucide-react"
import type { PhotoView } from "@/hooks/usePhotoView"
import { cn } from "@/lib/utils"

const MODES = [
  { value: "grid", icon: LayoutGrid, label: "サムネイル表示" },
  { value: "list", icon: List, label: "詳細リスト表示" },
] as const

type PhotoViewToggleProps = {
  view: PhotoView
  onChange: (view: PhotoView) => void
}

export function PhotoViewToggle({ view, onChange }: PhotoViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="写真の表示切り替え"
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
    >
      {MODES.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={view === value}
          onClick={() => onChange(value)}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-full transition-colors",
            view === value
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  )
}
