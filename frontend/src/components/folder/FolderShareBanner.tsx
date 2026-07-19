import { useState } from "react"
import { toast } from "sonner"
import { Check, Copy, Link2, Settings2, ShieldOff } from "lucide-react"
import type { EffectiveAccess } from "@/types"
import { Button } from "@/components/ui/button"
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"

type FolderShareBannerProps = {
  folderPath: string
  access: EffectiveAccess
  onOpenSettings: () => void
}

export function FolderShareBanner({
  folderPath,
  access,
  onOpenSettings,
}: FolderShareBannerProps) {
  const { viewAsRole, isOwner, setAccessRule } = usePhotoLibrary()
  const [copied, setCopied] = useState(false)

  if (access.mode !== "guest") return null

  const inheritedFromParent = access.source !== folderPath
  const canManage = viewAsRole === "admin" || isOwner(access.source)
  const shareUrl = `${window.location.origin}/g/${access.shareToken}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success("共有URLをコピーしました")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("コピーに失敗しました")
    }
  }

  const handleStop = () => {
    setAccessRule(access.source, { mode: "inherit" })
    toast.success("リンク共有を停止しました", {
      description: `${access.source} の共有設定を継承に戻しました`,
    })
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <Link2 className="size-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">
              このフォルダはリンクを知っている全員が閲覧・アップロード可能です
            </p>
            <p className="text-xs text-blue-800/80">
              {inheritedFromParent ? (
                <>
                  親フォルダ <span className="font-mono">{access.source === "/" ? "/" : access.source}</span> の共有設定により公開中
                </>
              ) : (
                <>このフォルダで直接 「リンクで共有」 が設定されています</>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="bg-white"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            URLをコピー
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="bg-white"
          >
            <Settings2 className="size-4" />
            詳細を見る
          </Button>
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStop}
              className="border-red-300 bg-white text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              <ShieldOff className="size-4" />
              共有を停止
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
