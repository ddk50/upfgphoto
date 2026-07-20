import { useEffect, useState } from "react"
import { SearchBar } from "@/components/search/SearchBar"
import { SuggestedTagChips } from "@/components/search/SuggestedTagChips"
import { FolderPage } from "@/pages/FolderPage"
import { api } from "@/lib/api"
import type { TagSummary } from "@/types"

// ルートのフォルダ表示は FolderPage (path="/") に一本化。
// ここは検索バーのヒーロー部だけを持つ (表示ロジックを二重に持たない)
export function HomePage() {
  const [tags, setTags] = useState<TagSummary[]>([])

  useEffect(() => {
    void api.tags().then(setTags).catch(() => setTags([]))
  }, [])

  return (
    <div>
      {/* モバイルはボトムバーの検索ボタンがあるため、ヒーロー検索は md 以上のみ */}
      <section className="hidden md:mb-10 md:block">
        <div className="mx-auto max-w-2xl space-y-4">
          <SearchBar size="lg" />
          <SuggestedTagChips tags={tags} max={10} />
        </div>
      </section>

      <FolderPage path="/" />
    </div>
  )
}
