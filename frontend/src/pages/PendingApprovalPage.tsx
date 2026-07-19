import { Clock, LogOut, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "@/contexts/SessionContext"

export function PendingApprovalPage() {
  const { user, logout } = useSession()

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card p-8 text-center space-y-6">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Clock className="size-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">管理者の承認をお待ちください</h1>
            <p className="text-sm text-muted-foreground">
              Google でサインインしたユーザは管理者の承認後に閲覧可能になります。承認されると次回アクセス時から通常のホーム画面が表示されます。
            </p>
          </div>
          {user && (
            <div className="space-y-2 rounded-xl bg-muted/40 px-4 py-3 text-left">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UserIcon className="size-3.5" />
                サインイン中のアカウント
              </div>
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">@{user.nickname}</div>
            </div>
          )}
          <Button variant="outline" onClick={() => void logout()} className="w-full">
            <LogOut className="size-4" />
            サインアウト
          </Button>
        </div>
      </div>
    </div>
  )
}
