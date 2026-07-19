import type { FolderNode } from "@/types"
import type { ChildInfo } from "@/lib/api"
import { FolderCard } from "./FolderCard"

type FolderGridProps = {
  folders: FolderNode[]
  info?: Record<string, ChildInfo>
}

export function FolderGrid({ folders, info }: FolderGridProps) {
  if (folders.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
      {folders.map((folder) => (
        <FolderCard key={folder.path} folder={folder} info={info?.[folder.path]} />
      ))}
    </div>
  )
}
