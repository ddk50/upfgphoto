import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSession } from "@/contexts/SessionContext"
import { api, type TrashPhoto } from "@/lib/api"

export function TrashPage() {
  const { isAdmin } = useSession()
  const [photos, setPhotos] = useState<TrashPhoto[] | null>(null)
  const [retentionDays, setRetentionDays] = useState(30)
  const [purgeTarget, setPurgeTarget] = useState<TrashPhoto | null>(null)

  const load = useCallback(async () => {
    try {
      const result = await api.trash()
      setPhotos(result.photos)
      setRetentionDays(result.retentionDays)
    } catch {
      setPhotos([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (!photos) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  const handleRestore = async (photo: TrashPhoto) => {
    try {
      await api.restoreFromTrash(photo.id)
      toast.success(`「${photo.title}」を復元しました`)
      void load()
    } catch {
      toast.error("復元に失敗しました")
    }
  }

  const handlePurge = async () => {
    if (!purgeTarget) return
    try {
      await api.purgeFromTrash(purgeTarget.id)
      toast.success(`「${purgeTarget.title}」を完全に削除しました`)
      setPurgeTarget(null)
      void load()
    } catch {
      toast.error("削除に失敗しました")
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Trash2 className="size-5 text-muted-foreground" />
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">ゴミ箱</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          削除した写真は {retentionDays} 日間ここに残り、その後自動的に完全削除されます。
          {isAdmin && "（管理者として全ユーザ分を表示しています）"}
        </p>
      </header>

      {photos.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <Trash2 className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">ゴミ箱は空です。</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {photos.map((p) => (
            <li key={p.id} className="space-y-2">
              <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                <img
                  src={p.thumbnailUrl}
                  alt={p.title}
                  loading="lazy"
                  className="size-full object-cover opacity-80"
                />
              </div>
              <div className="space-y-1 px-0.5">
                <p className="truncate text-xs font-medium">{p.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {remainingLabel(p.purgeDeadline)}
                  {isAdmin && !p.isMine && ` ・ ${p.uploaderName}`}
                </p>
                <div className="flex gap-1.5 pt-0.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 text-xs"
                    onClick={() => void handleRestore(p)}
                  >
                    <RotateCcw className="size-3" />
                    復元
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                    onClick={() => setPurgeTarget(p)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!purgeTarget} onOpenChange={(o) => !o && setPurgeTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>完全に削除しますか？</DialogTitle>
            <DialogDescription>
              「{purgeTarget?.title}」を実ファイルごと今すぐ削除します。この操作は元に戻せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPurgeTarget(null)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={() => void handlePurge()}>
              <Trash2 className="size-4" />
              完全に削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function remainingLabel(deadline: string): string {
  const days = Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000))
  return days === 0 ? "まもなく完全削除" : `残り ${days} 日`
}
