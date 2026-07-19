import { useMemo } from "react"
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"
import { FolderGrid } from "@/components/folder/FolderGrid"
import { CreateFolderButton } from "@/components/folder/CreateFolderButton"
import { SearchBar } from "@/components/search/SearchBar"
import { SuggestedTagChips } from "@/components/search/SuggestedTagChips"
import { summarizeTags } from "@/lib/search"

export function HomePage() {
  const { tree, photos } = usePhotoLibrary()
  const popularTags = useMemo(() => summarizeTags(photos), [photos])

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="mx-auto max-w-2xl space-y-4">
          <SearchBar size="lg" />
          <SuggestedTagChips tags={popularTags} max={10} />
        </div>
      </section>

      <section className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">ライブラリ</h1>
            <p className="text-sm text-muted-foreground">
              {tree.descendantPhotoCount} 枚の写真 ・ {tree.children.length} フォルダ
            </p>
          </div>
          <CreateFolderButton parentPath="/" />
        </header>

        <FolderGrid folders={tree.children} />
      </section>
    </div>
  )
}
