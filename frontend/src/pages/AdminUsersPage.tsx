import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Ban,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Infinity as InfinityIcon,
  Link2,
  Loader2,
  Search,
  Shield,
  TimerOff,
  User as UserIcon,
  X as XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSession } from "@/contexts/SessionContext"
import { api, type AdminUser, type ApiUser, type PendingUser } from "@/lib/api"
import { cn } from "@/lib/utils"

export function AdminUsersPage() {
  const { isAdmin } = useSession()
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [pending, setPending] = useState<PendingUser[]>([])
  const [candidates, setCandidates] = useState<ApiUser[]>([])
  const [filter, setFilter] = useState("")

  const load = useCallback(async () => {
    try {
      const [us, ps] = await Promise.all([api.adminUsers(), api.pendingUsers()])
      setUsers(us)
      setPending(ps.pending)
      setCandidates(ps.linkCandidates)
    } catch {
      toast.error("ユーザ情報の取得に失敗しました")
      setUsers([])
    }
  }, [])

  useEffect(() => {
    if (isAdmin) void load()
  }, [isAdmin, load])

  const changeExpiration = async (u: AdminUser, value: string | null) => {
    await api.updateAdminUser(u.id, { expiresAt: value })
    toast.success(
      value === null
        ? "ログイン期限を解除しました（無期限）"
        : `ログイン期限を ${formatDate(value)} に設定しました`,
    )
    void load()
  }

  const filtered = useMemo(() => {
    if (!users) return []
    const f = filter.trim().toLowerCase()
    if (!f) return users
    return users.filter(
      (u) =>
        (u.email ?? "").toLowerCase().includes(f) ||
        u.name.toLowerCase().includes(f) ||
        u.nickname.toLowerCase().includes(f),
    )
  }, [users, filter])

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  if (!users) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-red-600" />
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">ユーザ管理</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          承認待ちの新規 Google ログインを、旧 Twitter アカウントへの紐付けか新規承認で受け入れます。
        </p>
      </header>

      <Tabs defaultValue={pending.length > 0 ? "pending" : "active"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            アクティブ
            <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
              {users.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="pending">
            承認待ち
            {pending.length > 0 && (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] tabular-nums text-amber-800">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium">アクティブユーザ（{users.length}人）</h2>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="名前・ID・メールで絞り込み"
                className="pl-9 h-9 w-full"
              />
            </div>
          </div>

          {/* モバイル: カード型リスト */}
          <div className="space-y-3 md:hidden">
            {filtered.map((u) => {
              const inactive = u.banned || u.expired
              return (
                <div
                  key={u.id}
                  className={cn("space-y-3 rounded-2xl border bg-card p-4", inactive && "bg-muted/30")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <UserIdentity user={u} showId />
                    <BanButton user={u} onDone={load} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusCell banned={u.banned} expired={u.expired} />
                    <ProviderChips providers={u.providers} />
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t pt-3">
                    <span className="text-xs text-muted-foreground">ログイン期限</span>
                    <ExpirationCell
                      user={u}
                      disabled={u.isSelf}
                      onChange={(value) => changeExpiration(u, value)}
                    />
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <p className="rounded-2xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                該当するユーザがいません。
              </p>
            )}
          </div>

          {/* md 以上: テーブル */}
          <div className="hidden overflow-x-auto rounded-2xl border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">ユーザ</th>
                  <th className="px-4 py-3 text-left font-medium">認証</th>
                  <th className="px-4 py-3 text-left font-medium">ログイン期限</th>
                  <th className="px-4 py-3 text-left font-medium">状態</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((u) => {
                  const inactive = u.banned || u.expired
                  return (
                    <tr key={u.id} className={cn(inactive && "bg-muted/30")}>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground tabular-nums">
                        {u.id}
                      </td>
                      <td className="px-4 py-3">
                        <UserIdentity user={u} />
                      </td>
                      <td className="px-4 py-3">
                        <ProviderChips providers={u.providers} />
                      </td>
                      <td className="px-4 py-3">
                        <ExpirationCell
                          user={u}
                          disabled={u.isSelf}
                          onChange={(value) => changeExpiration(u, value)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <StatusCell banned={u.banned} expired={u.expired} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <BanButton user={u} onDone={load} />
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
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
            <h2 className="text-sm font-medium">承認待ちユーザ（{pending.length}人）</h2>
            <p className="text-xs text-muted-foreground">
              Google でサインインした新規ユーザです。旧 Twitter アカウントの人は「紐付け」で資産を引き継ぎ、新規メンバーは「承認」してください。
            </p>
          </div>
          {/* モバイル: カード型リスト */}
          <div className="space-y-3 md:hidden">
            {pending.map((u) => (
              <div key={u.id} className="space-y-3 rounded-2xl border bg-card p-4">
                <PendingIdentity user={u} />
                <p className="text-xs text-muted-foreground">申請日: {formatDate(u.requestedAt)}</p>
                <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
                  <PendingActions pendingUser={u} candidates={candidates} onDone={load} />
                </div>
              </div>
            ))}
            {pending.length === 0 && (
              <p className="rounded-2xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                承認待ちのユーザはいません。
              </p>
            )}
          </div>

          {/* md 以上: テーブル */}
          <div className="hidden overflow-x-auto rounded-2xl border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">ユーザ</th>
                  <th className="px-4 py-3 text-left font-medium">申請日</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pending.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <PendingIdentity user={u} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(u.requestedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <PendingActions pendingUser={u} candidates={candidates} onDone={load} />
                      </div>
                    </td>
                  </tr>
                ))}
                {pending.length === 0 && (
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

// アバター + 名前 + バッジ + サブ情報。テーブル行とモバイルカードで共用
function UserIdentity({ user, showId }: { user: AdminUser; showId?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className="size-9 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <UserIcon className="size-4 text-muted-foreground" />
        </span>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{user.name}</span>
          {user.role === "admin" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] text-red-800">
              <Shield className="size-3" />
              admin
            </span>
          )}
          {user.isSelf && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              自分
            </span>
          )}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {showId && <span className="font-mono tabular-nums">#{user.id} ・ </span>}
          @{user.nickname}
          {user.email && ` ・ ${user.email}`}
        </div>
      </div>
    </div>
  )
}

function ProviderChips({ providers }: { providers: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {providers.map((p) => (
        <span
          key={p}
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px]",
            p === "google_oauth2"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-muted text-muted-foreground",
          )}
        >
          {p === "google_oauth2" ? "Google" : "Twitter (未移行)"}
        </span>
      ))}
    </div>
  )
}

function BanButton({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  return (
    <Button
      variant={user.banned ? "outline" : "ghost"}
      size="sm"
      disabled={user.isSelf}
      onClick={async () => {
        await api.updateAdminUser(user.id, { banned: !user.banned })
        toast.success(user.banned ? "Banを解除しました" : "ユーザをBanしました")
        onDone()
      }}
      className={cn(
        !user.banned && !user.isSelf && "text-red-700 hover:bg-red-50 hover:text-red-800",
      )}
    >
      {user.banned ? "Unban" : "Ban"}
    </Button>
  )
}

// 承認待ちユーザの名前 + バッジ + メール。テーブル行とモバイルカードで共用
function PendingIdentity({ user }: { user: PendingUser }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{user.name}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
          <Clock className="size-3" />
          承認待ち
        </span>
      </div>
      <div className="truncate text-xs text-muted-foreground">
        {user.googleEmail ?? user.email ?? `@${user.nickname}`}
      </div>
    </div>
  )
}

function PendingActions({
  pendingUser,
  candidates,
  onDone,
}: {
  pendingUser: PendingUser
  candidates: ApiUser[]
  onDone: () => void
}) {
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          await api.rejectPendingUser(pendingUser.id)
          toast.success(`却下しました: ${pendingUser.name}`)
          onDone()
        }}
        className="text-muted-foreground"
      >
        <XIcon className="size-4" />
        却下
      </Button>
      <LinkButton pendingUser={pendingUser} candidates={candidates} onLinked={onDone} />
      <Button
        size="sm"
        onClick={async () => {
          await api.approvePendingUser(pendingUser.id)
          toast.success(`新規ユーザとして承認しました: ${pendingUser.name}`)
          onDone()
        }}
      >
        <Check className="size-4" />
        新規承認
      </Button>
    </>
  )
}

// 旧 Twitter-only ユーザへの紐付け (ADR-020「すんなり移行」)
function LinkButton({
  pendingUser,
  candidates,
  onLinked,
}: {
  pendingUser: PendingUser
  candidates: ApiUser[]
  onLinked: () => void
}) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState("")
  const [linking, setLinking] = useState(false)

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase()
    if (!f) return candidates
    return candidates.filter(
      (c) => c.name.toLowerCase().includes(f) || c.nickname.toLowerCase().includes(f),
    )
  }, [candidates, filter])

  const handleLink = async (target: ApiUser) => {
    setLinking(true)
    try {
      await api.linkPendingUser(pendingUser.id, target.id)
      toast.success(`${pendingUser.name} を ${target.name} (@${target.nickname}) に紐付けました`, {
        description: "旧アカウントの写真・フォルダをそのまま引き継ぎます",
      })
      setOpen(false)
      onLinked()
    } catch {
      toast.error("紐付けに失敗しました")
    } finally {
      setLinking(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Link2 className="size-4" />
          既存ユーザへ紐付け
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <div className="space-y-1">
          <h4 className="text-sm font-medium">旧アカウントに紐付け</h4>
          <p className="text-xs text-muted-foreground">
            {pendingUser.googleEmail ?? pendingUser.name} の Google アカウントを、まだ移行していない既存ユーザに接続します。
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="名前・IDで検索"
            className="pl-9 h-9"
          />
        </div>
        <ScrollArea className="h-56 rounded-xl border bg-card">
          <ul className="divide-y">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={linking}
                  onClick={() => void handleLink(c)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/60"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-muted">
                    <UserIcon className="size-4 text-muted-foreground" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      @{c.nickname}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-sm text-muted-foreground">候補がいません。</li>
            )}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
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
  user: AdminUser
  disabled: boolean
  onChange: (value: string | null) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(toDateInputValue(user.expiresAt))

  const handleSave = async () => {
    if (!draft) return
    await onChange(new Date(`${draft}T23:59:59`).toISOString())
    setOpen(false)
  }

  const handleClear = async () => {
    await onChange(null)
    setDraft("")
    setOpen(false)
  }

  const trigger = user.expiresAt ? (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
        user.expired ? "text-amber-800 hover:bg-amber-50" : "text-foreground hover:bg-muted",
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
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => void handleClear()} className="text-muted-foreground">
            無期限に戻す
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={!draft}>
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
