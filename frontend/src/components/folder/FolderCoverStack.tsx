import type { ReactNode } from "react"
import type { Photo } from "@/types"
import { Folder } from "lucide-react"
import { cn } from "@/lib/utils"

type FolderCoverStackProps = {
  coverPhoto?: Photo
  name: string
  className?: string
  children?: ReactNode
}

export function FolderCoverStack({ coverPhoto, name, className, children }: FolderCoverStackProps) {
  return (
    <div className="relative pt-2.5">
      <div className="absolute inset-x-4 top-0 h-4 rounded-t-lg bg-muted-foreground/15" />
      <div className="absolute inset-x-2 top-1 h-4 rounded-t-lg bg-muted-foreground/25" />
      <div
        className={cn(
          "relative aspect-square overflow-hidden rounded-2xl bg-muted",
          className,
        )}
      >
        {coverPhoto ? (
          <img
            src={coverPhoto.thumbnailUrl}
            alt={name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Folder className="size-10" />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
