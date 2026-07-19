import { useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { LoaderCircle, LogIn, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSession } from "@/contexts/SessionContext"
import { api } from "@/lib/api"

export function LoginPage() {
  const { devLogin } = useSession()
  const [devUserId, setDevUserId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const tokenRef = useRef<HTMLInputElement>(null)
  const loginError = new URLSearchParams(window.location.search).get("login")

  // CSRF トークンは押下時に取り直す。起動時の並行 me フェッチ (StrictMode の二重実行等) で
  // セッション Cookie とページロード時のトークンが別セッションになり得るため、
  // Cookie が確定したこの時点で現セッションのトークンを取得してから POST する
  const handleGoogleLogin = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const me = await api.me()
      if (tokenRef.current) tokenRef.current.value = me.csrf
      formRef.current?.submit() // ネイティブ submit は onSubmit を再発火しない
    } catch {
      setSubmitting(false)
      toast.error("サーバに接続できません。しばらくして再度お試しください。")
    }
  }

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
          <form ref={formRef} method="post" action="/auth/google_oauth2" onSubmit={handleGoogleLogin}>
            <input ref={tokenRef} type="hidden" name="authenticity_token" />
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <LogIn className="size-4" />}
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
