import { ArrowDown, ArrowUp, ChevronsUpDown, Folder, Link2 } from "lucide-react"
import type { FolderNode, Photo } from "@/types"
import type { ChildInfo } from "@/lib/api"
import { Checkbox } from "@/components/ui/checkbox"
import { formatDateTime } from "@/lib/format"
import { nextSort, type PhotoSort, type PhotoSortKey } from "@/lib/photoSort"
import { cn } from "@/lib/utils"

// PhotoGrid の「詳細リスト」版 (Explorer の詳細表示相当)。photo 系 props は PhotoGrid と同形。
// folders を渡すとフォルダ行を写真の上に出す (クリックで移動)
type PhotoListViewProps = {
  photos: Photo[]
  onSelect: (photo: Photo, index: number) => void
  folders?: FolderNode[]
  folderInfo?: Record<string, ChildInfo>
  onOpenFolder?: (path: string) => void
  showShareIndicators?: boolean
  selectionMode?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (next: Set<string>) => void
  // 渡すとタイトル・撮影日時の列ヘッダがソートスイッチになる (photos はソート済みを渡すこと)
  sort?: PhotoSort
  onSortChange?: (sort: PhotoSort) => void
}

const MAX_TAG_CHIPS = 3

// 列幅は table-fixed + th の幅指定で確定させる (タイトル列だけ可変)
const CELL = "px-3 py-1.5 overflow-hidden"

export function PhotoListView({
  photos,
  onSelect,
  folders = [],
  folderInfo,
  onOpenFolder,
  showShareIndicators,
  selectionMode,
  selectedIds,
  onSelectionChange,
  sort,
  onSortChange,
}: PhotoListViewProps) {
  if (photos.length === 0 && folders.length === 0) return null

  const toggle = (id: string) => {
    if (!onSelectionChange) return
    const next = new Set(selectedIds ?? [])
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            {selectionMode && <th className={cn(CELL, "w-10 py-2")} aria-label="選択" />}
            <th className={cn(CELL, "w-16 py-2")} aria-label="サムネイル" />
            <th className={cn(CELL, "py-2 font-medium")}>
              <SortableLabel label="タイトル" sortKey="title" sort={sort} onSortChange={onSortChange} />
            </th>
            <th className={cn(CELL, "w-40 py-2 font-medium")}>
              <SortableLabel label="撮影日時" sortKey="takenAt" sort={sort} onSortChange={onSortChange} />
            </th>
            <th className={cn(CELL, "hidden w-40 py-2 font-medium md:table-cell")}>
              アップロード / オーナー
            </th>
            <th className={cn(CELL, "hidden w-56 py-2 font-medium lg:table-cell")}>キーワード</th>
          </tr>
        </thead>
        <tbody>
          {folders.map((folder) => {
            const info = folderInfo?.[folder.path]
            return (
              <tr
                key={`folder:${folder.path}`}
                onClick={() => onOpenFolder?.(folder.path)}
                className="cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/60"
              >
                {selectionMode && <td className={CELL} />}
                <td className={CELL}>
                  <span className="flex size-10 items-center justify-center">
                    <Folder className="size-6 fill-amber-200 text-amber-400" />
                  </span>
                </td>
                <td className={CELL}>
                  <span className="flex items-baseline gap-2">
                    <span className="truncate font-medium">{folder.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {folder.descendantPhotoCount} 枚
                    </span>
                  </span>
                </td>
                <td className={cn(CELL, "text-muted-foreground")}>—</td>
                <td className={cn(CELL, "hidden text-muted-foreground md:table-cell")}>
                  {info?.ownerName && (
                    <span className="flex min-w-0 items-center gap-1.5">
                      {info.ownerAvatarUrl && (
                        <img
                          src={info.ownerAvatarUrl}
                          alt=""
                          className="size-4 shrink-0 rounded-full object-cover"
                        />
                      )}
                      <span className="truncate">{info.ownerName}</span>
                    </span>
                  )}
                </td>
                <td className={cn(CELL, "hidden lg:table-cell")} />
              </tr>
            )
          })}
          {photos.map((photo, i) => {
            const shared = showShareIndicators && photo.effectiveMode === "guest"
            const selected = selectedIds?.has(photo.id) ?? false
            const tags = photo.tags ?? []
            return (
              <tr
                key={photo.id}
                onClick={() => {
                  if (selectionMode) toggle(photo.id)
                  else onSelect(photo, i)
                }}
                className={cn(
                  "cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/60",
                  selectionMode && selected && "bg-primary/5",
                )}
              >
                {selectionMode && (
                  <td className={CELL} onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggle(photo.id)}
                      aria-label={`${photo.title} を選択`}
                    />
                  </td>
                )}
                <td className={CELL}>
                  <img
                    src={photo.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    className="size-10 rounded-md bg-muted object-cover"
                  />
                </td>
                <td className={CELL}>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate font-medium">{photo.title}</span>
                    {shared && <Link2 className="size-3.5 shrink-0 text-blue-600" />}
                  </span>
                </td>
                <td className={cn(CELL, "whitespace-nowrap tabular-nums text-muted-foreground")}>
                  {formatDateTime(photo.takenAt)}
                </td>
                <td className={cn(CELL, "hidden text-muted-foreground md:table-cell")}>
                  <span className="flex min-w-0 items-center gap-1.5">
                    {photo.uploaderAvatarUrl && (
                      <img
                        src={photo.uploaderAvatarUrl}
                        alt=""
                        className="size-4 shrink-0 rounded-full object-cover"
                      />
                    )}
                    <span className="truncate">{photo.uploaderName ?? "—"}</span>
                  </span>
                </td>
                <td className={cn(CELL, "hidden lg:table-cell")}>
                  {tags.length > 0 && (
                    <span className="flex items-center gap-1 overflow-hidden">
                      {tags.slice(0, MAX_TAG_CHIPS).map((t) => (
                        <span
                          key={t}
                          className="max-w-24 truncate rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                      {tags.length > MAX_TAG_CHIPS && (
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          +{tags.length - MAX_TAG_CHIPS}
                        </span>
                      )}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SortableLabel({
  label,
  sortKey,
  sort,
  onSortChange,
}: {
  label: string
  sortKey: PhotoSortKey
  sort?: PhotoSort
  onSortChange?: (sort: PhotoSort) => void
}) {
  if (!onSortChange) return <>{label}</>
  const active = sort?.key === sortKey
  return (
    <button
      type="button"
      onClick={() => onSortChange(nextSort(sort ?? null, sortKey))}
      aria-label={`${label}でソート`}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
        active && "text-foreground",
      )}
    >
      {label}
      {active ? (
        sort?.dir === "asc" ? (
          <ArrowUp className="size-3" />
        ) : (
          <ArrowDown className="size-3" />
        )
      ) : (
        <ChevronsUpDown className="size-3 opacity-40" />
      )}
    </button>
  )
}
