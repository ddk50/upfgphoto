import type { StorageInfo } from "@/types"
import { formatBytes } from "@/lib/format"
import { cn } from "@/lib/utils"
import { HardDrive } from "lucide-react"

type StorageBarProps = {
  storage: StorageInfo
  variant?: "compact" | "full"
  className?: string
}

export function StorageBar({ storage, variant = "full", className }: StorageBarProps) {
  const { totalBytes, usedBytes } = storage
  const ratio = totalBytes > 0 ? Math.min(1, Math.max(0, usedBytes / totalBytes)) : 0
  const percent = Math.round(ratio * 100)
  const isCritical = ratio >= 0.9
  const isWarning = ratio >= 0.75

  const barColor = isCritical
    ? "bg-red-500"
    : isWarning
      ? "bg-amber-500"
      : "bg-primary"

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "hidden lg:flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5",
          className,
        )}
        title={`${formatBytes(usedBytes)} / ${formatBytes(totalBytes)} 使用中`}
      >
        <HardDrive className="size-3.5 text-muted-foreground" />
        <div className="h-1 w-20 overflow-hidden rounded-full bg-border">
          <div
            className={cn("h-full rounded-full", barColor)}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatBytes(usedBytes)} / {formatBytes(totalBytes)}
        </span>
      </div>
    )
  }

  const remaining = Math.max(0, totalBytes - usedBytes)

  return (
    <div className={cn("rounded-2xl border bg-card p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <HardDrive className="size-3.5" />
            ストレージ
          </h2>
          <p className="text-lg font-semibold tabular-nums">
            {formatBytes(usedBytes)}
            <span className="text-sm text-muted-foreground font-normal"> / {formatBytes(totalBytes)}</span>
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div className="tabular-nums text-base text-foreground font-semibold">{percent}%</div>
          <div>残り {formatBytes(remaining)}</div>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-300", barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
      {isWarning && (
        <p className={cn("mt-2 text-xs", isCritical ? "text-red-600" : "text-amber-600")}>
          {isCritical ? "ストレージが残り少なくなっています。" : "ストレージ使用量が増えています。"}
        </p>
      )}
    </div>
  )
}
