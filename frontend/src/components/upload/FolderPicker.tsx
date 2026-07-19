import { useEffect, useRef, useState } from "react"
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

// value がツリー上に存在するか (「＋フォルダ」経由のこれから作るパスかどうかの判定)
function containsPath(node: FolderNode, path: string): boolean {
  if (node.path === path) return true
  return node.children.some((c) => containsPath(c, path))
}

export function FolderPicker({ root, value, onChange }: FolderPickerProps) {
  // これから作る新規パスがプリセットされているときは「新規パス」タブを初期表示。
  // 誤って既存フォルダをクリックして保存先が変わる事故を防ぐ
  const [initialTab] = useState(() =>
    value === "/" || containsPath(root, value) ? "existing" : "new",
  )
  return (
    <Tabs defaultValue={initialTab} className="w-full">
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
  // 選択パスの祖先は初期展開しておく (プリセットが深い階層でも選択が見えるように)
  const isAncestorOfSelected =
    node.path === "/" ? selectedPath !== "/" : selectedPath.startsWith(`${node.path}/`)
  const [open, setOpen] = useState(depth < 1 || isAncestorOfSelected)
  const isSelected = selectedPath === node.path && depth !== 0
  const hasChildren = node.children.length > 0
  const label = depth === 0 ? "ライブラリ直下" : node.name
  const rowRef = useRef<HTMLDivElement>(null)

  // 選択が自分の配下に移ったら展開する (手で畳んだ状態は選択が変わらない限り維持)
  useEffect(() => {
    if (isAncestorOfSelected) setOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath])

  // 選択ノードを視界内へ (初期表示で下の方にあってもスクロールなしで見える)
  useEffect(() => {
    if (isSelected) rowRef.current?.scrollIntoView({ block: "nearest" })
  }, [isSelected])

  return (
    <div>
      <div
        ref={rowRef}
        className={cn(
          "flex items-center gap-1 rounded-md px-1.5 py-1 text-sm",
          isSelected && "bg-muted font-medium",
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
          // ルート直下への保存は整理上防ぐ (ADR-014 の意図)。ルート行は展開トグルとして扱う
          onClick={() => (depth === 0 ? setOpen((v) => !v) : onSelect(node.path))}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 text-left hover:text-foreground",
            depth === 0 && "text-muted-foreground",
          )}
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
