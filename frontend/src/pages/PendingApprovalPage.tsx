import { toast } from "sonner"
import { Clock, LogOut, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"

export function PendingApprovalPage() {
  const { currentUser } = usePhotoLibrary()
  const joined = new Date(currentUser.joinedAt)
  const joinedLabel = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(joined)

  return (
    <div className="mx-auto max-w-md py-12">
      <div className="rounded-2xl border bg-card p-8 text-center space-y-6">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Clock className="size-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">管理者の承認をお待ちください</h1>
          <p className="text-sm text-muted-foreground">
            Gmail でサインインしたユーザは管理者の承認後に閲覧可能になります。承認されると自動的に通常のホーム画面が表示されます。
          </p>
        </div>
        <div className="space-y-2 rounded-xl bg-muted/40 px-4 py-3 text-left">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="size-3.5" />
            申請メール
          </div>
          <div className="font-medium">{currentUser.email}</div>
          <div className="text-xs text-muted-foreground">申請日: {joinedLabel}</div>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            toast.info("サインアウトしました（モック）", {
              description: "実装では Gmail のセッションを終了します",
            })
          }
          className="w-full"
        >
          <LogOut className="size-4" />
          サインアウト
        </Button>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        モック: アバターメニューの「View as」で他のロールに戻れます
      </p>
    </div>
  )
}
