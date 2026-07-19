import { useMemo, useState, type FormEvent } from "react"
import { Link, Navigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Ban,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Infinity as InfinityIcon,
  Plus,
  Search,
  Shield,
  TimerOff,
  X as XIcon,
} from "lucide-react"
import type { User } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"
import { isExpired } from "@/lib/access"
import { cn } from "@/lib/utils"

export function AdminUsersPage() {
  const {
    viewAsRole,
    activeUsers,
    pendingUsers,
    banUser,
    unbanUser,
    addUser,
    approveUser,
    rejectUser,
    setUserExpiration,
    currentUser,
  } = usePhotoLibrary()
  const [filter, setFilter] = useState("")
  const [handleInput, setHandleInput] = useState("")
  const [nameInput, setNameInput] = useState("")

  if (viewAsRole !== "admin") {
    return <Navigate to="/" replace />
  }

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase()
    if (!f) return activeUsers
    return activeUsers.filter(
      (u) =>
        u.email.toLowerCase().includes(f) || u.name.toLowerCase().includes(f),
    )
  }, [activeUsers, filter])

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!handleInput.trim()) return
    const created = addUser({ email: handleInput.trim(), name: nameInput.trim() })
    toast.success(`新規申請を追加しました: ${created.email}`, {
      description: "（モックなのでリロードで消えます）",
    })
    setHandleInput("")
    setNameInput("")
  }

  const handleToggleBan = (id: string, banned: boolean) => {
    if (banned) {
      unbanUser(id)
      toast.success("Banを解除しました")
    } else {
      banUser(id)
      toast.success("ユーザをBanしました")
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-red-600" />
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">ユーザ管理</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          管理者として表示。ログイン許可ユーザの追加・Ban・Unban・有効期限の設定ができます。
        </p>
      </header>

      <section className="rounded-2xl border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-medium">新規申請を追加（デモ用）</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          実運用ではユーザが Gmail でサインインすると自動で承認待ちキューに入ります。これはデモ用の手動追加。
        </p>
        <form onSubmit={handleAdd} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1">
            <Label htmlFor="add-handle" className="text-xs text-muted-foreground">Gmail アドレス</Label>
            <Input
              id="add-handle"
              type="email"
              value={handleInput}
              onChange={(e) => setHandleInput(e.target.value)}
              placeholder="newmember@gmail.com"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="add-name" className="text-xs text-muted-foreground">表示名（任意）</Label>
            <Input
              id="add-name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="新メンバー"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={!handleInput.trim()}>
              <Plus className="size-4" />
              追加
            </Button>
          </div>
        </form>
      </section>

      <Separator />

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            アクティブ
            <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
              {activeUsers.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="pending">
            承認待ち
            {pendingUsers.length > 0 && (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] tabular-nums text-amber-800">
                {pendingUsers.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium">アクティブユーザ（{activeUsers.length}人）</h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="名前・メールで絞り込み"
              className="pl-9 h-9 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">ユーザ</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">参加日</th>
                <th className="px-4 py-3 text-left font-medium">ログイン期限</th>
                <th className="px-4 py-3 text-left font-medium">状態</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((u) => {
                const isSelf = u.id === currentUser.id
                const expired = isExpired(u)
                const inactive = !!u.banned || expired
                return (
                  <tr key={u.id} className={cn(inactive && "bg-muted/30")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="size-9 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{u.name}</span>
                            {isSelf && (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                自分
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                      {formatDate(u.joinedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <ExpirationCell
                        user={u}
                        disabled={isSelf}
                        onChange={(value) => {
                          setUserExpiration(u.id, value)
                          if (value === null) {
                            toast.success("ログイン期限を解除しました（無期限）")
                          } else {
                            toast.success(`ログイン期限を ${formatDate(value)} に設定しました`)
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusCell banned={!!u.banned} expired={expired} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant={u.banned ? "outline" : "ghost"}
                        size="sm"
                        disabled={isSelf}
                        onClick={() => handleToggleBan(u.id, !!u.banned)}
                        className={cn(
                          !u.banned && !isSelf && "text-red-700 hover:bg-red-50 hover:text-red-800",
                        )}
                      >
                        {u.banned ? "Unban" : "Ban"}
                      </Button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    該当するユーザがいません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-medium">承認待ちユーザ（{pendingUsers.length}人）</h2>
            <p className="text-xs text-muted-foreground">
              Gmail でサインインしたユーザが承認待ちとして並びます。承認するまで本サービスにアクセスできません。
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">ユーザ</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">申請日</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="size-9 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{u.name}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
                              <Clock className="size-3" />
                              承認待ち
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                      {formatDate(u.joinedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            rejectUser(u.id)
                            toast.success(`却下しました: ${u.email}`)
                          }}
                          className="text-muted-foreground"
                        >
                          <XIcon className="size-4" />
                          却下
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            approveUser(u.id)
                            toast.success(`承認しました: ${u.email}`)
                          }}
                        >
                          <Check className="size-4" />
                          承認
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingUsers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      承認待ちのユーザはいません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        <Link to="/" className="underline">ホームに戻る</Link>
      </p>
    </div>
  )
}

function StatusCell({ banned, expired }: { banned: boolean; expired: boolean }) {
  if (banned) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
        <Ban className="size-3" />
        Banned
      </span>
    )
  }
  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
        <TimerOff className="size-3" />
        期限切れ
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
      <CheckCircle2 className="size-3" />
      Active
    </span>
  )
}

function ExpirationCell({
  user,
  disabled,
  onChange,
}: {
  user: User
  disabled: boolean
  onChange: (value: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(toDateInputValue(user.expiresAt))
  const expired = isExpired(user)

  const handleSave = () => {
    if (!draft) return
    const iso = new Date(`${draft}T23:59:59`).toISOString()
    onChange(iso)
    setOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setDraft("")
    setOpen(false)
  }

  const trigger = user.expiresAt ? (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
        expired
          ? "text-amber-800 hover:bg-amber-50"
          : "text-foreground hover:bg-muted",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <CalendarClock className="size-3.5" />
      {formatDate(user.expiresAt)} まで
    </button>
  ) : (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        disabled && "cursor-not-allowed opacity-60 hover:bg-transparent hover:text-muted-foreground",
      )}
    >
      <InfinityIcon className="size-3.5" />
      無期限
    </button>
  )

  if (disabled) return trigger

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) setDraft(toDateInputValue(user.expiresAt))
      }}
    >
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3">
        <div className="space-y-1">
          <h4 className="text-sm font-medium">ログイン有効期限</h4>
          <p className="text-xs text-muted-foreground">
            設定した日付の23:59まで {user.name} はログイン可能です。
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`exp-${user.id}`} className="text-xs text-muted-foreground">
            期限日
          </Label>
          <Input
            id={`exp-${user.id}`}
            type="date"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            min={todayInputValue()}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground">
            無期限に戻す
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!draft}>
            保存
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(d)
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  const y = d.getFullYear().toString().padStart(4, "0")
  const m = (d.getMonth() + 1).toString().padStart(2, "0")
  const day = d.getDate().toString().padStart(2, "0")
  return `${y}-${m}-${day}`
}

function todayInputValue(): string {
  return toDateInputValue(new Date().toISOString())
}
