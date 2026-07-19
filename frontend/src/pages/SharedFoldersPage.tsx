import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Check, Copy, Folder, History, Link2, ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"
import type { ShareHistoryEntry } from "@/types"
import { cn } from "@/lib/utils"

type Entry = {
  path: string
  shareToken: string
  thumb?: string
  photoCount: number
  ownerName: string
  isMine: boolean
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
}

export function SharedFoldersPage() {
  const {
    accessRules,
    shareHistory,
    findNode,
    getFolderOwner,
    isOwner,
    viewAsRole,
    setAccessRule,
  } = usePhotoLibrary()
  const navigate = useNavigate()
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const isAdmin = viewAsRole === "admin"

  const entries = useMemo<Entry[]>(() => {
    const result: Entry[] = []
    for (const [path, rule] of Object.entries(accessRules)) {
      if (rule.mode !== "guest") continue
      const node = findNode(path)
      const owner = getFolderOwner(path)
      const mine = isOwner(path)
      if (!isAdmin && !mine) continue
      result.push({
        path,
        shareToken: rule.shareToken,
        thumb: node?.coverPhoto?.thumbnailUrl,
        photoCount: node?.descendantPhotoCount ?? 0,
        ownerName: owner.name,
        isMine: mine,
      })
    }
    return result.sort((a, b) => a.path.localeCompare(b.path))
  }, [accessRules, findNode, getFolderOwner, isOwner, isAdmin])

  const mineEntries = useMemo(() => entries.filter((e) => e.isMine), [entries])
  const otherEntries = useMemo(() => entries.filter((e) => !e.isMine), [entries])

  const history = useMemo(
    () => [...shareHistory].sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1)),
    [shareHistory],
  )

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

  const handleStop = (path: string) => {
    setAccessRule(path, { mode: "inherit" })
    toast.success("リンク共有を停止しました", {
      description: path,
    })
  }

  const renderEntryList = (list: Entry[]) => (
    <ul className="space-y-3">
      {list.map((e) => (
        <li
          key={e.path}
          className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-3 sm:p-4"
        >
          <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
            {e.thumb ? (
              <img src={e.thumb} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <Folder className="size-6" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium font-mono text-sm">{e.path}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-800 ring-1 ring-blue-200">
                <Link2 className="size-3" />
                リンクで共有
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{e.photoCount} 枚</span>
              <span>オーナー: {e.ownerName}{e.isMine && "（あなた）"}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleCopy(e.shareToken)}>
              {copiedToken === e.shareToken ? <Check className="size-4" /> : <Copy className="size-4" />}
              URL
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/folders${e.path}`)}
            >
              開く
            </Button>
            {(e.isMine || isAdmin) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStop(e.path)}
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
      <p className="mt-4 text-sm text-muted-foreground">
        現在共有中のフォルダはありません。
      </p>
    </div>
  )

  const activeContent = isAdmin ? (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          あなたの共有 <span className="tabular-nums">({mineEntries.length})</span>
        </h2>
        {mineEntries.length > 0 ? (
          renderEntryList(mineEntries)
        ) : (
          <p className="text-sm text-muted-foreground">あなたが共有中のフォルダはありません。</p>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          他のユーザの共有 <span className="tabular-nums">({otherEntries.length})</span>
        </h2>
        {otherEntries.length > 0 ? (
          renderEntryList(otherEntries)
        ) : (
          <p className="text-sm text-muted-foreground">他のユーザの共有はありません。</p>
        )}
      </section>
    </div>
  ) : entries.length > 0 ? (
    renderEntryList(entries)
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
              共有中 ({entries.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="size-4" />
              履歴 ({history.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4">
            {activeContent}
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <ShareHistoryList history={history} onCopy={handleCopy} copiedToken={copiedToken} />
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
  history: ShareHistoryEntry[]
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
        const stopped = !!e.stoppedAt
        const proxyStopped = stopped && e.stoppedByName !== e.issuedByName
        return (
          <li
            key={e.token}
            className={cn(
              "flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-3 sm:p-4",
              stopped && "opacity-75",
            )}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium font-mono text-sm">{e.path}</span>
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
                  発行: {formatDate(e.issuedAt)} ・ {e.issuedByName}
                </span>
                {stopped && (
                  <span>
                    停止: {formatDate(e.stoppedAt!)} ・ {e.stoppedByName}
                    {proxyStopped && "（代理）"}
                    {e.stoppedReason === "parent-override" && "（親フォルダの設定変更）"}
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
