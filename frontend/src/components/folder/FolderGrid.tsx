import type { FolderNode } from "@/types"
import { FolderCard } from "./FolderCard"

type FolderGridProps = {
  folders: FolderNode[]
}

export function FolderGrid({ folders }: FolderGridProps) {
  if (folders.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
      {folders.map((folder) => (
        <FolderCard key={folder.path} folder={folder} />
      ))}
    </div>
  )
}
