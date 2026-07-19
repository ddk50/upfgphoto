import { Link } from "react-router-dom"
import type { TagSummary } from "@/types"
import { serializeTagsParam } from "@/lib/search"
import { Sparkles } from "lucide-react"

type SuggestedTagChipsProps = {
  tags: TagSummary[]
  max?: number
}

export function SuggestedTagChips({ tags, max = 10 }: SuggestedTagChipsProps) {
  const limited = tags.slice(0, max)
  if (limited.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="size-3.5" />
        よく使われるキーワード
      </span>
      {limited.map((t) => (
        <Link
          key={t.name}
          to={`/search?tags=${encodeURIComponent(serializeTagsParam([t.name]))}`}
          className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs transition-colors hover:border-foreground/30 hover:bg-muted"
        >
          {t.name}
        </Link>
      ))}
    </div>
  )
}
