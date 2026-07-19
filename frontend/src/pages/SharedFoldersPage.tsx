import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Check, Copy, Folder, History, Link2, Loader2, ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession } from "@/contexts/SessionContext"
import { api, type ShareLinkEntry } from "@/lib/api"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
}

export function SharedFoldersPage() {
  const { isAdmin } = useSession()
  const navigate = useNavigate()
  const [links, setLinks] = useState<ShareLinkEntry[] | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLinks(await api.shareLinks())
    } catch {
      setLinks([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const active = useMemo(() => (links ?? []).filter((l) => l.active), [links])
  const mineActive = useMemo(() => active.filter((l) => l.own), [active])
  const otherActive = useMemo(() => active.filter((l) => !l.own), [active])

  const handleCopy = async (token: string) => {
    const url = `${window.location.origin}/g/${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedToken(token)
      toast.success("共有URLをコピーしました")
      setTimeout(() => setCopiedToken(null), 2000)
    } catch {
      toast.error("コピーに失敗しました")
    }
  }

  const handleStop = async (folderPath: string) => {
    try {
      await api.saveAccessRule({ path: folderPath, mode: "inherit" })
      toast.success("リンク共有を停止しました", { description: folderPath })
      void load()
    } catch {
      toast.error("停止に失敗しました（権限がない可能性があります）")
    }
  }

  if (!links) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  const renderEntryList = (list: ShareLinkEntry[]) => (
    <ul className="space-y-3">
      {list.map((e) => (
        <li
          key={e.token}
          className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-3 sm:p-4"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium font-mono text-sm">{e.folderPath}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-800 ring-1 ring-blue-200">
                <Link2 className="size-3" />
                リンクで共有
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>発行: {formatDate(e.issuedAt)}</span>
              <span>
                オーナー: {e.folderOwner ?? "不明"}
                {e.own && "（あなた）"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void handleCopy(e.token)}>
              {copiedToken === e.token ? <Check className="size-4" /> : <Copy className="size-4" />}
              URL
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/folders${e.folderPath}`)}>
              開く
            </Button>
            {(e.own || isAdmin) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleStop(e.folderPath)}
                className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                <ShieldOff className="size-4" />
                停止
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )

  const emptyState = (
    <div className="rounded-2xl border bg-card p-12 text-center">
      <Folder className="mx-auto size-10 text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">現在共有中のフォルダはありません。</p>
    </div>
  )

  const activeContent = isAdmin ? (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          あなたの共有 <span className="tabular-nums">({mineActive.length})</span>
        </h2>
        {mineActive.length > 0 ? (
          renderEntryList(mineActive)
        ) : (
          <p className="text-sm text-muted-foreground">あなたが共有中のフォルダはありません。</p>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          他のユーザの共有 <span className="tabular-nums">({otherActive.length})</span>
        </h2>
        {otherActive.length > 0 ? (
          renderEntryList(otherActive)
        ) : (
          <p className="text-sm text-muted-foreground">他のユーザの共有はありません。</p>
        )}
      </section>
    </div>
  ) : active.length > 0 ? (
    renderEntryList(active)
  ) : (
    emptyState
  )

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Link2 className="size-5 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">共有中のフォルダ</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "管理者として全ての共有フォルダを表示しています。"
            : "あなたがオーナーの共有フォルダだけを表示しています。"}
        </p>
      </header>

      {isAdmin ? (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              <Link2 className="size-4" />
              共有中 ({active.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="size-4" />
              履歴 ({links.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4">
            {activeContent}
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <ShareHistoryList history={links} onCopy={handleCopy} copiedToken={copiedToken} />
          </TabsContent>
        </Tabs>
      ) : (
        activeContent
      )}

      <p className="text-xs text-muted-foreground">
        <Link to="/" className="underline">ホームに戻る</Link>
      </p>
    </div>
  )
}

function ShareHistoryList({
  history,
  onCopy,
  copiedToken,
}: {
  history: ShareLinkEntry[]
  onCopy: (token: string) => void
  copiedToken: string | null
}) {
  if (history.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center">
        <History className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">共有URLの発行履歴はありません。</p>
      </div>
    )
  }
  return (
    <ul className="space-y-3">
      {history.map((e) => {
        const stopped = !e.active
        const proxyStopped = stopped && e.revokedBy !== e.issuedBy
        return (
          <li
            key={e.token}
            className={`flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-3 sm:p-4 ${stopped ? "opacity-75" : ""}`}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium font-mono text-sm">{e.folderPath}</span>
                {stopped ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border">
                    <ShieldOff className="size-3" />
                    停止済み
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-800 ring-1 ring-blue-200">
                    <Link2 className="size-3" />
                    共有中
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono">/g/{e.token.slice(0, 8)}…</span>
                <span>
                  発行: {formatDate(e.issuedAt)} ・ {e.issuedBy}
                </span>
                {stopped && e.revokedAt && (
                  <span>
                    停止: {formatDate(e.revokedAt)} ・ {e.revokedBy}
                    {proxyStopped && "（代理）"}
                    {e.revokedReason === "parent-override" && "（親フォルダの設定変更）"}
                  </span>
                )}
              </div>
            </div>
            {!stopped && (
              <Button variant="outline" size="sm" onClick={() => onCopy(e.token)}>
                {copiedToken === e.token ? <Check className="size-4" /> : <Copy className="size-4" />}
                URL
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
