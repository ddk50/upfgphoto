import { useEffect, useMemo, useState } from "react"
import { Navigate, useSearchParams } from "react-router-dom"
import { Link2, Search, Tag, User as UserIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { PhotoGrid } from "@/components/photo/PhotoGrid"
import { Lightbox } from "@/components/photo/Lightbox"
import { FolderGrid } from "@/components/folder/FolderGrid"
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"
import {
  parseTagsParam,
  searchFolders,
  searchPhotos,
  serializeTagsParam,
  summarizeTags,
} from "@/lib/search"
import { cn } from "@/lib/utils"

export function SearchPage() {
  const { photos, tree, viewAsRole, getPhotoEffectiveAccess, isMyPhoto } = usePhotoLibrary()
  const [searchParams, setSearchParams] = useSearchParams()

  if (viewAsRole === "guest") {
    return <Navigate to="/" replace />
  }
  const query = searchParams.get("q") ?? ""
  const selected = parseTagsParam(searchParams.get("tags"))
  const ownedFilter = searchParams.get("owned") === "me"

  const [queryDraft, setQueryDraft] = useState(query)
  const [tagFilter, setTagFilter] = useState("")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    setQueryDraft(query)
  }, [query])

  const allTags = useMemo(() => summarizeTags(photos), [photos])

  const visibleTags = useMemo(() => {
    if (!tagFilter.trim()) return allTags
    const t = tagFilter.trim().toLowerCase()
    return allTags.filter((tag) => tag.name.toLowerCase().includes(t))
  }, [allTags, tagFilter])

  const rawResults = useMemo(
    () => searchPhotos(photos, { query, tags: selected }),
    [photos, query, selected],
  )

  const matchedFolders = useMemo(() => searchFolders(tree, query), [tree, query])

  const mineCount = useMemo(() => rawResults.filter((p) => isMyPhoto(p)).length, [rawResults, isMyPhoto])
  const othersCount = rawResults.length - mineCount

  const results = useMemo(
    () => (ownedFilter ? rawResults.filter((p) => isMyPhoto(p)) : rawResults),
    [rawResults, ownedFilter, isMyPhoto],
  )

  const sharedCount = useMemo(
    () =>
      results.filter((p) => getPhotoEffectiveAccess(p.path).mode === "guest").length,
    [results, getPhotoEffectiveAccess],
  )

  const updateParams = (next: { q?: string; tags?: string[]; owned?: boolean }) => {
    const params = new URLSearchParams(searchParams)
    if (next.q !== undefined) {
      if (next.q) params.set("q", next.q)
      else params.delete("q")
    }
    if (next.tags !== undefined) {
      if (next.tags.length > 0) params.set("tags", serializeTagsParam(next.tags))
      else params.delete("tags")
    }
    if (next.owned !== undefined) {
      if (next.owned) params.set("owned", "me")
      else params.delete("owned")
    }
    setSearchParams(params, { replace: true })
    setLightboxIndex(null)
  }

  const toggleOwned = () => updateParams({ owned: !ownedFilter })

  const submitQuery = () => updateParams({ q: queryDraft.trim() })

  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) updateParams({ tags: selected.filter((t) => t !== tag) })
    else updateParams({ tags: [...selected, tag] })
  }

  const clearAll = () => {
    setQueryDraft("")
    updateParams({ q: "", tags: [], owned: false })
  }

  const hasFilter = query.length > 0 || selected.length > 0

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">検索</h1>
        <p className="text-sm text-muted-foreground">
          パス・タイトル・キーワードを横断して写真を絞り込めます。
        </p>
      </header>

      <section className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitQuery()
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={queryDraft}
              onChange={(e) => setQueryDraft(e.target.value)}
              placeholder="写真を検索..."
              className="pl-9 h-11 text-base"
            />
          </div>
        </form>

        {(query || selected.length > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">絞り込み中:</span>
            {query && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs text-primary-foreground">
                <Search className="size-3" />「{query}」
                <button
                  type="button"
                  onClick={() => {
                    setQueryDraft("")
                    updateParams({ q: "" })
                  }}
                  className="ml-0.5"
                  aria-label="クエリを解除"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {selected.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {tag}
                <X className="size-3" />
              </button>
            ))}
            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
                すべて解除
              </Button>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Tag className="size-3.5" />
              キーワードで絞り込む
            </h2>
            <Input
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder="キーワード名で絞り込む"
              className="h-8 max-w-48 text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleTags.map((t) => {
              const active = selected.includes(t.name)
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => toggleTag(t.name)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-foreground/30 hover:bg-muted",
                  )}
                >
                  {t.name}
                  <span
                    className={cn(
                      "tabular-nums",
                      active ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {t.count}
                  </span>
                </button>
              )
            })}
            {visibleTags.length === 0 && (
              <p className="text-sm text-muted-foreground">該当するキーワードがありません。</p>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {matchedFolders.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">フォルダ</h2>
            <p className="text-xs text-muted-foreground tabular-nums">{matchedFolders.length} 件</p>
          </div>
          <FolderGrid folders={matchedFolders} />
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">写真</h2>
          <p className="text-xs text-muted-foreground tabular-nums">
            自分 {mineCount}枚 ・ 他 {othersCount}枚
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleOwned}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
              ownedFilter
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-foreground/30 hover:bg-muted",
            )}
          >
            <UserIcon className="size-3.5" />
            自分のだけ
          </button>
          {ownedFilter && (
            <span className="text-xs text-muted-foreground">{results.length}枚を表示中</span>
          )}
        </div>
        {sharedCount > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs text-blue-900">
            <Link2 className="mt-0.5 size-3.5 shrink-0" />
            <span>
              結果には <span className="font-semibold">限定公開リンクで共有中</span> の写真が {sharedCount} 枚含まれています。
              該当の写真には右上に <Link2 className="inline size-3 align-text-bottom" /> アイコンが付きます。
            </span>
          </div>
        )}
        {results.length > 0 ? (
          <PhotoGrid
            photos={results}
            onSelect={(_p, i) => setLightboxIndex(i)}
            showShareIndicators
            showUploaderBadges
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {hasFilter || ownedFilter
              ? matchedFolders.length > 0
                ? "写真の直接マッチはありません。上のフォルダの中を見てみてください。"
                : "条件に一致する写真がありません。フィルタを減らしてみてください。"
              : "検索ワードかキーワードを選ぶと結果が表示されます。"}
          </p>
        )}
      </section>

      {lightboxIndex !== null && results[lightboxIndex] && (
        <Lightbox
          photos={results}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  )
}
