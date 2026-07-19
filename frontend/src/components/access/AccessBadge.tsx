import { Globe, Link2, Lock } from "lucide-react"
import type { EffectiveAccess } from "@/types"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type AccessBadgeProps = {
  access: EffectiveAccess
  size?: "sm" | "md"
  variant?: "icon" | "pill"
  showWhenPublic?: boolean
  className?: string
}

export function AccessBadge({
  access,
  size = "sm",
  variant = "icon",
  showWhenPublic = false,
  className,
}: AccessBadgeProps) {
  const isRestricted = access.mode === "restricted"
  const isGuest = access.mode === "guest"
  const isPublic = access.mode === "everyone"
  if (isPublic && !showWhenPublic) return null

  const sizeClass = size === "md" ? "size-8" : "size-6"
  const iconClass = size === "md" ? "size-4" : "size-3.5"

  const sourceLabel = access.source === "/" ? "ルート" : access.source
  const tooltipText = isRestricted
    ? `${access.allowedUserIds.length}人のみ閲覧可（${sourceLabel}で制限）`
    : isGuest
      ? `リンクを知っている人のみ閲覧可（${sourceLabel}で共有）`
      : "全員に公開"

  const Icon = isRestricted ? Lock : isGuest ? Link2 : Globe

  const colorClass = isRestricted
    ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
    : isGuest
      ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200"
      : "bg-muted text-muted-foreground"

  if (variant === "pill") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
              colorClass,
              className,
            )}
          >
            <Icon className="size-3.5" />
            {isRestricted
              ? `${access.allowedUserIds.length}人のみ`
              : isGuest
                ? "リンクで共有"
                : "全員に公開"}
          </span>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    )
  }

  const iconColorClass = isRestricted
    ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
    : isGuest
      ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200"
      : "bg-background/80 text-muted-foreground ring-1 ring-border"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full",
            sizeClass,
            iconColorClass,
            className,
          )}
          aria-label={tooltipText}
        >
          <Icon className={iconClass} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  )
}
