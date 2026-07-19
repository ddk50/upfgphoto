import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Loader2, Search, Tag, User as UserIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { PhotoGrid } from "@/components/photo/PhotoGrid"
import { PhotoListView } from "@/components/photo/PhotoListView"
import { PhotoViewToggle } from "@/components/photo/PhotoViewToggle"
import { usePhotoView } from "@/hooks/usePhotoView"
import { sortPhotos, type PhotoSort } from "@/lib/photoSort"
import { Lightbox } from "@/components/photo/Lightbox"
import { FolderGrid } from "@/components/folder/FolderGrid"
import { api, type SearchResult } from "@/lib/api"
import { parseTagsParam, serializeTagsParam } from "@/lib/search"
import type { TagSummary } from "@/types"
import { cn } from "@/lib/utils"

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get("q") ?? ""
  const selected = parseTagsParam(searchParams.get("tags"))
  const ownedFilter = searchParams.get("owned") === "me"

  const [queryDraft, setQueryDraft] = useState(query)
  const [tagFilter, setTagFilter] = useState("")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [photoView, setPhotoView] = usePhotoView()
  const [photoSort, setPhotoSort] = useState<PhotoSort>(null)
  const [allTags, setAllTags] = useState<TagSummary[]>([])
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setQueryDraft(query)
  }, [query])

  useEffect(() => {
    void api.tags().then(setAllTags).catch(() => setAllTags([]))
  }, [])

  const hasFilter = query.length > 0 || selected.length > 0

  useEffect(() => {
    if (!hasFilter && !ownedFilter) {
      setResult(null)
      return
    }
    let cancelled = false
    setLoading(true)
    void api
      .search({ q: query, tags: selected, owned: ownedFilter })
      .then((r) => {
        if (!cancelled) setResult(r)
      })
      .catch(() => {
        if (!cancelled) setResult({ folders: [], photos: [] })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchParams.get("tags"), ownedFilter])

  const visibleTags = useMemo(() => {
    if (!tagFilter.trim()) return allTags
    const t = tagFilter.trim().toLowerCase()
    return allTags.filter((tag) => tag.name.toLowerCase().includes(t))
  }, [allTags, tagFilter])

  const photos = useMemo(() => {
    const base = result?.photos ?? []
    return photoView === "list" ? sortPhotos(base, photoSort) : base
  }, [result, photoView, photoSort])
  const matchedFolders = result?.folders ?? []
  const mineCount = useMemo(() => photos.filter((p) => p.isMine).length, [photos])
  const othersCount = photos.length - mineCount

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

  const submitQuery = () => updateParams({ q: queryDraft.trim() })
  const toggleOwned = () => updateParams({ owned: !ownedFilter })
  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) updateParams({ tags: selected.filter((t) => t !== tag) })
    else updateParams({ tags: [...selected, tag] })
  }
  const clearAll = () => {
    setQueryDraft("")
    updateParams({ q: "", tags: [], owned: false })
  }

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
            {visibleTags.slice(0, 40).map((t) => {
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

      {loading && (
        <div className="flex justify-center py-8 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}

      {!loading && matchedFolders.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">フォルダ</h2>
            <p className="text-xs text-muted-foreground tabular-nums">{matchedFolders.length} 件</p>
          </div>
          <FolderGrid folders={matchedFolders} />
        </section>
      )}

      {!loading && (
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
            <PhotoViewToggle view={photoView} onChange={setPhotoView} />
          </div>
          {photos.length > 0 ? (
            photoView === "list" ? (
              <PhotoListView
                photos={photos}
                onSelect={(_p, i) => setLightboxIndex(i)}
                sort={photoSort}
                onSortChange={setPhotoSort}
              />
            ) : (
              <PhotoGrid photos={photos} onSelect={(_p, i) => setLightboxIndex(i)} />
            )
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
      )}

      {lightboxIndex !== null && photos[lightboxIndex] && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  )
}
