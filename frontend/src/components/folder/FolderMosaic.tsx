import { Link } from "react-router-dom"
import { Folder, Link2, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

// iPhone 写真アプリ風の階層モザイク (モバイル用)。
// 大カード = 現在フォルダ直下の子フォルダ、隣の小カード = その子のサブフォルダ (孫) への直接入口。
// サブフォルダを持たない子フォルダは縦長カード2枚組にまとめる。大カードの位置は左右交互
export type MosaicItem = {
  key: string
  name: string
  photoCount: number
  coverUrl: string | null
  to: string
  mode?: "everyone" | "restricted" | "guest"
  // 他人所有のときだけ渡す (FolderCard の showOwner と同じ意味論)
  ownerAvatarUrl?: string | null
  ownerName?: string | null
}

export type MosaicGroup = {
  folder: MosaicItem
  subfolders: MosaicItem[] // 孫 (先頭2枚まで表示)
  subfolderCount: number // 総数 ("+n" 表示用)
}

export function FolderMosaic({ groups }: { groups: MosaicGroup[] }) {
  // サブフォルダを持つ子 → 大+小のトリオ、持たない子 → 縦長ペアに詰める。元の順序は維持
  const rows: (
    | { kind: "trio"; group: MosaicGroup; reversed: boolean }
    | { kind: "pair"; items: MosaicItem[] }
  )[] = []
  let pending: MosaicItem[] = []
  let trioIndex = 0

  const flushPending = () => {
    while (pending.length > 0) {
      rows.push({ kind: "pair", items: pending.slice(0, 2) })
      pending = pending.slice(2)
    }
  }

  for (const g of groups) {
    if (g.subfolders.length > 0) {
      flushPending()
      rows.push({ kind: "trio", group: g, reversed: trioIndex % 2 === 1 })
      trioIndex += 1
    } else {
      pending.push(g.folder)
    }
  }
  flushPending()

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        if (row.kind === "pair") {
          return (
            <div
              key={row.items[0].key}
              className={cn("grid gap-3", row.items.length === 2 ? "grid-cols-2" : "grid-cols-1")}
            >
              {row.items.map((item) => (
                <MosaicCard
                  key={item.key}
                  item={item}
                  className={row.items.length === 2 ? "aspect-[3/4]" : "aspect-[16/10]"}
                  large={row.items.length === 1}
                />
              ))}
            </div>
          )
        }

        const { group, reversed } = row
        const shown = group.subfolders.slice(0, 2)
        const more = group.subfolderCount - shown.length
        return (
          <div key={group.folder.key} className={cn("flex gap-3", reversed && "flex-row-reverse")}>
            <MosaicCard item={group.folder} large className="aspect-[4/5] flex-[2]" />
            <div className="flex flex-1 flex-col gap-3">
              {shown.map((sub, i) => {
                const isOverflowCard = more > 0 && i === shown.length - 1
                return (
                  <MosaicCard
                    key={sub.key}
                    // あふれ分がある場合、最後の小カードは親フォルダへ誘導 (残りをそこで見る)
                    item={isOverflowCard ? { ...sub, to: group.folder.to } : sub}
                    className="min-h-0 flex-1"
                    moreCount={isOverflowCard ? more : undefined}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MosaicCard({
  item,
  className,
  large,
  moreCount,
}: {
  item: MosaicItem
  className?: string
  large?: boolean
  moreCount?: number
}) {
  return (
    <Link
      to={item.to}
      className={cn(
        "group relative block overflow-hidden rounded-2xl bg-muted outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {item.coverUrl ? (
        <img
          src={item.coverUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-active:scale-[1.03]"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          <Folder className="size-8 text-muted-foreground" />
        </span>
      )}

      {/* 名前の可読性のためのスクリム (iPhone 写真の左上ラベルと同じ構図) */}
      <span className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-black/55 to-transparent" />

      <span className="absolute left-3 right-3 top-2.5 text-white">
        <span
          className={cn(
            "block truncate font-semibold drop-shadow-sm",
            large ? "text-xl" : "text-sm",
          )}
        >
          {item.name}
        </span>
        <span className="block text-[11px] text-white/85 tabular-nums drop-shadow-sm">
          {item.photoCount} 枚
        </span>
      </span>

      {/* サブフォルダのあふれ分: 「+n」で親フォルダへ */}
      {moreCount !== undefined && moreCount > 0 && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/45">
          <span className="text-lg font-semibold text-white">+{moreCount}</span>
        </span>
      )}

      {/* アクセス状態・オーナー (FolderCard と同じ情報を最小表現で) */}
      <span className="absolute bottom-2 right-2 flex items-center gap-1.5">
        {item.mode === "restricted" && (
          <span className="flex size-6 items-center justify-center rounded-full bg-black/45">
            <Lock className="size-3.5 text-white" />
          </span>
        )}
        {item.mode === "guest" && (
          <span className="flex size-6 items-center justify-center rounded-full bg-blue-500/90">
            <Link2 className="size-3.5 text-white" />
          </span>
        )}
        {item.ownerAvatarUrl && (
          <img
            src={item.ownerAvatarUrl}
            alt={item.ownerName ?? ""}
            title={item.ownerName ? `${item.ownerName} のフォルダ` : undefined}
            className="size-6 rounded-full object-cover ring-1 ring-white/80"
          />
        )}
      </span>
    </Link>
  )
}
