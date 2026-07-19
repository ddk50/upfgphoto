import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Folder, Image as ImageIcon, Search, Tag } from "lucide-react"
import { api, type SearchResult } from "@/lib/api"
import { dirParts, joinPath } from "@/lib/path"
import type { TagSummary } from "@/types"
import { cn } from "@/lib/utils"

type SearchBarProps = {
  initialValue?: string
  size?: "lg" | "md"
  autoFocus?: boolean
  onSubmit?: (query: string) => void
}

type Suggestion =
  | { kind: "folder"; label: string; sub: string; to: string }
  | { kind: "tag"; label: string; count: number; to: string }
  | { kind: "photo"; label: string; sub: string; thumb: string; to: string }
  | { kind: "search"; label: string; to: string }

const KIND_HEADINGS: Record<string, string> = {
  folder: "フォルダ",
  tag: "キーワード",
  photo: "写真",
}

export function SearchBar({ initialValue = "", size = "lg", autoFocus, onSubmit }: SearchBarProps) {
  const [value, setValue] = useState(initialValue)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [allTags, setAllTags] = useState<TagSummary[]>([])
  const requestSeq = useRef(0)
  const navigate = useNavigate()

  useEffect(() => {
    void api.tags().then(setAllTags).catch(() => setAllTags([]))
  }, [])

  const q = value.trim().toLowerCase()

  // API へのデバウンス付きサジェスト検索
  useEffect(() => {
    if (!q) {
      setResult(null)
      return
    }
    const seq = ++requestSeq.current
    const timer = setTimeout(() => {
      void api
        .search({ q })
        .then((r) => {
          if (requestSeq.current === seq) setResult(r)
        })
        .catch(() => {
          if (requestSeq.current === seq) setResult(null)
        })
    }, 250)
    return () => clearTimeout(timer)
  }, [q])

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!q) return []
    const out: Suggestion[] = []
    for (const f of (result?.folders ?? []).slice(0, 4)) {
      out.push({ kind: "folder", label: f.name, sub: f.path, to: `/folders${f.path}` })
    }
    for (const t of allTags.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 4)) {
      out.push({
        kind: "tag",
        label: t.name,
        count: t.count,
        to: `/search?tags=${encodeURIComponent(t.name)}`,
      })
    }
    for (const p of (result?.photos ?? []).slice(0, 4)) {
      const dir = joinPath(dirParts(p.path))
      out.push({
        kind: "photo",
        label: p.title,
        sub: dir,
        thumb: p.thumbnailUrl,
        to: `/folders${dir === "/" ? "" : dir}`,
      })
    }
    out.push({
      kind: "search",
      label: value.trim(),
      to: `/search?q=${encodeURIComponent(value.trim())}`,
    })
    return out
  }, [q, result, allTags, value])

  const showDropdown = open && suggestions.length > 0

  const go = (s: Suggestion) => {
    setOpen(false)
    setActiveIndex(-1)
    navigate(s.to)
  }

  const submit = () => {
    const query = value.trim()
    setOpen(false)
    setActiveIndex(-1)
    if (onSubmit) {
      onSubmit(query)
    } else if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`)
    } else {
      navigate(`/search`)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (activeIndex >= 0 && activeIndex < suggestions.length) {
      go(suggestions[activeIndex])
    } else {
      submit()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === "Escape") {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <form onSubmit={handleSubmit} role="search">
      <div className="relative">
        <Search
          className={cn(
            "pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted-foreground",
            size === "lg" ? "size-5" : "size-4",
          )}
        />
        <input
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false)
            setActiveIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder="写真を検索..."
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          className={cn(
            "w-full rounded-full border border-border bg-card pr-4 outline-none transition-shadow",
            "placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
            size === "lg" ? "h-14 pl-12 text-base sm:text-lg" : "h-10 pl-10 text-sm",
          )}
        />

        {showDropdown && (
          <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-96 overflow-auto rounded-2xl border bg-card py-1.5 shadow-lg">
            {suggestions.map((s, i) => {
              const heading =
                s.kind !== "search" && (i === 0 || suggestions[i - 1].kind !== s.kind)
                  ? KIND_HEADINGS[s.kind]
                  : null
              return (
                <div key={`${s.kind}-${s.to}-${s.label}`}>
                  {heading && (
                    <p className="px-4 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {heading}
                    </p>
                  )}
                  {s.kind === "search" && suggestions.length > 1 && (
                    <div className="my-1.5 border-t" />
                  )}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      go(s)
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2 text-left text-sm",
                      i === activeIndex ? "bg-muted" : "hover:bg-muted/60",
                    )}
                  >
                    {s.kind === "folder" && (
                      <>
                        <Folder className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium">{s.label}</span>
                        <span className="ml-auto truncate font-mono text-xs text-muted-foreground">
                          {s.sub}
                        </span>
                      </>
                    )}
                    {s.kind === "tag" && (
                      <>
                        <Tag className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{s.label}</span>
                        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                          {s.count}
                        </span>
                      </>
                    )}
                    {s.kind === "photo" && (
                      <>
                        <span className="size-8 shrink-0 overflow-hidden rounded-md bg-muted">
                          <img src={s.thumb} alt="" className="size-full object-cover" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate">{s.label}</span>
                          <span className="block truncate font-mono text-[11px] text-muted-foreground">
                            {s.sub}
                          </span>
                        </span>
                        <ImageIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
                      </>
                    )}
                    {s.kind === "search" && (
                      <>
                        <Search className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                          「<span className="font-medium">{s.label}</span>」をすべての結果で検索
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </form>
  )
}
