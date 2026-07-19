import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import type { TagSummary } from "@/types"
import { cn } from "@/lib/utils"

// カンマ・空白区切りのキーワード入力に、既存タグのサジェストを付けた Input。
// SearchBar と同じく全タグを一括取得してクライアント側で絞り込む (母数は数百程度)
type TagSuggestInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const SEPARATOR = /[\s,、]/
const MAX_SUGGESTIONS = 8

type Token = { query: string; start: number; end: number }

export function TagSuggestInput({ id, value, onChange, placeholder }: TagSuggestInputProps) {
  const [allTags, setAllTags] = useState<TagSummary[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [token, setToken] = useState<Token | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void api.tags().then(setAllTags).catch(() => setAllTags([]))
  }, [])

  // カーソル位置にある編集中トークンを求める。絞り込みはカーソルまでの入力分で行い、
  // 確定時はトークン全体 (start..end) を置換する
  const recomputeToken = () => {
    const el = inputRef.current
    if (!el) return
    const pos = el.selectionStart ?? el.value.length
    const val = el.value
    let start = pos
    while (start > 0 && !SEPARATOR.test(val[start - 1])) start--
    let end = pos
    while (end < val.length && !SEPARATOR.test(val[end])) end++
    setToken({ query: val.slice(start, pos), start, end })
  }

  const suggestions = useMemo(() => {
    const q = token?.query.trim().toLowerCase()
    if (!q) return []
    const entered = new Set(value.split(/[\s,、]+/).filter(Boolean))
    return allTags
      .filter((t) => t.name.toLowerCase().includes(q) && !entered.has(t.name))
      .slice(0, MAX_SUGGESTIONS)
  }, [token, value, allTags])

  const showDropdown = open && suggestions.length > 0

  const apply = (tagName: string) => {
    if (!token) return
    const before = value.slice(0, token.start)
    const after = value.slice(token.end)
    // 末尾での確定なら区切りを足して次のキーワードを続けて打てるようにする
    const tail = after.length === 0 ? ", " : after
    const next = before + tagName + tail
    onChange(next)
    setOpen(false)
    setActiveIndex(-1)
    const caret = token.start + tagName.length + (after.length === 0 ? 2 : 0)
    requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < suggestions.length) {
      e.preventDefault()
      apply(suggestions[activeIndex].name)
    } else if (e.key === "Escape") {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div className="relative">
      <Input
        id={id}
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setActiveIndex(-1)
          recomputeToken()
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={recomputeToken}
        onClick={recomputeToken}
        onFocus={() => {
          setOpen(true)
          recomputeToken()
        }}
        onBlur={() => {
          setOpen(false)
          setActiveIndex(-1)
        }}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {showDropdown && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-xl border bg-card py-1 shadow-lg">
          {suggestions.map((t, i) => (
            <button
              key={t.name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                apply(t.name)
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm",
                i === activeIndex ? "bg-muted" : "hover:bg-muted/60",
              )}
            >
              <Tag className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{t.name}</span>
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">{t.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
