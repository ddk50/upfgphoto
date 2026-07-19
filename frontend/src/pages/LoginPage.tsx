import { useState } from "react"
import { toast } from "sonner"
import { LogIn, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSession } from "@/contexts/SessionContext"

export function LoginPage() {
  const { csrf, devLogin } = useSession()
  const [devUserId, setDevUserId] = useState("")
  const loginError = new URLSearchParams(window.location.search).get("login")

  const handleDevLogin = async () => {
    const id = Number(devUserId)
    if (!id) return
    try {
      await devLogin(id)
    } catch {
      toast.error("dev ログインに失敗しました", { description: `user_id=${id} が存在しない可能性` })
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Uprun Photos</h1>
          <p className="text-sm text-muted-foreground">メンバー向けの写真共有サービスです</p>
        </div>

        {loginError === "expired" && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
            アカウントの有効期限が切れています。管理者に連絡してください。
          </div>
        )}
        {loginError === "failed" && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2 text-xs text-red-900">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
            ログインに失敗しました。もう一度お試しください。
          </div>
        )}

        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <form method="post" action="/auth/google_oauth2">
            <input type="hidden" name="authenticity_token" value={csrf} />
            <Button type="submit" className="w-full" size="lg">
              <LogIn className="size-4" />
              Google でログイン
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            初回ログイン後、管理者の承認をもって利用開始になります
          </p>
        </div>

        {import.meta.env.DEV && (
          <div className="rounded-2xl border border-dashed p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">開発用ログイン（dev 環境のみ）</p>
            <div className="flex gap-2">
              <Input
                value={devUserId}
                onChange={(e) => setDevUserId(e.target.value)}
                placeholder="user id (例: 1)"
                className="h-9"
              />
              <Button variant="outline" size="sm" className="h-9" onClick={handleDevLogin}>
                ログイン
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
