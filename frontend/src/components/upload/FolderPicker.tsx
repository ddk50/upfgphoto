import { useState } from "react"
import { ChevronRight, Folder, FolderOpen } from "lucide-react"
import type { FolderNode } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type FolderPickerProps = {
  root: FolderNode
  value: string
  onChange: (path: string) => void
}

export function FolderPicker({ root, value, onChange }: FolderPickerProps) {
  return (
    <Tabs defaultValue="existing" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="existing">既存フォルダ</TabsTrigger>
        <TabsTrigger value="new">新規パス</TabsTrigger>
      </TabsList>
      <TabsContent value="existing" className="mt-3">
        <div className="rounded-2xl border bg-card p-2">
          <ScrollArea className="h-64">
            <TreeNode node={root} depth={0} selectedPath={value} onSelect={onChange} />
          </ScrollArea>
        </div>
      </TabsContent>
      <TabsContent value="new" className="mt-3 space-y-2">
        <Label htmlFor="folder-path" className="text-xs text-muted-foreground">
          フォルダパス
        </Label>
        <Input
          id="folder-path"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/2025/旅行/北海道"
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          スラッシュ区切りで自由に階層を作れます。
        </p>
      </TabsContent>
    </Tabs>
  )
}

function TreeNode({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: FolderNode
  depth: number
  selectedPath: string
  onSelect: (path: string) => void
}) {
  const [open, setOpen] = useState(depth < 1)
  const isSelected = selectedPath === node.path
  const hasChildren = node.children.length > 0
  const label = depth === 0 ? "ライブラリ直下" : node.name

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 rounded-md px-1.5 py-1 text-sm",
          isSelected && "bg-muted",
        )}
        style={{ paddingLeft: 6 + depth * 14 }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex size-5 items-center justify-center rounded text-muted-foreground transition-transform",
            !hasChildren && "invisible",
            open && "rotate-90",
          )}
          aria-label={open ? "閉じる" : "開く"}
        >
          <ChevronRight className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onSelect(node.path)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left hover:text-foreground"
        >
          {open && hasChildren ? (
            <FolderOpen className="size-4 text-muted-foreground" />
          ) : (
            <Folder className="size-4 text-muted-foreground" />
          )}
          <span className="truncate">{label}</span>
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {node.descendantPhotoCount}
          </span>
        </button>
      </div>
      {open && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
