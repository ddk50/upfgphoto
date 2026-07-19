import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { FolderGrid } from "@/components/folder/FolderGrid"
import { CreateFolderButton } from "@/components/folder/CreateFolderButton"
import { SearchBar } from "@/components/search/SearchBar"
import { SuggestedTagChips } from "@/components/search/SuggestedTagChips"
import { api, type FolderView } from "@/lib/api"
import type { TagSummary } from "@/types"

export function HomePage() {
  const [view, setView] = useState<FolderView | null>(null)
  const [tags, setTags] = useState<TagSummary[]>([])

  useEffect(() => {
    void api.folder("/").then(setView).catch(() => setView(null))
    void api.tags().then(setTags).catch(() => setTags([]))
  }, [])

  const totalPhotos = view
    ? view.folders.reduce((sum, f) => sum + f.descendantPhotoCount, 0) + view.photos.length
    : 0

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="mx-auto max-w-2xl space-y-4">
          <SearchBar size="lg" />
          <SuggestedTagChips tags={tags} max={10} />
        </div>
      </section>

      <section className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">ライブラリ</h1>
            <p className="text-sm text-muted-foreground">
              {view ? `${totalPhotos} 枚の写真 ・ ${view.folders.length} フォルダ` : " "}
            </p>
          </div>
          <CreateFolderButton parentPath="/" />
        </header>

        {view ? (
          <FolderGrid folders={view.folders} info={view.childInfo} />
        ) : (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}
      </section>
    </div>
  )
}
