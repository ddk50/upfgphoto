import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { FolderPlus, ImageUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { joinPath, splitPath } from "@/lib/path"

type CreateFolderButtonProps = {
  parentPath: string
}

export function CreateFolderButton({ parentPath }: CreateFolderButtonProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const navigate = useNavigate()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return
    const fullPath = joinPath([...splitPath(parentPath), ...splitPath(clean)])
    setName("")
    setOpen(false)
    navigate(`/upload?to=${encodeURIComponent(fullPath)}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        aria-label="サブフォルダを作成"
      >
        <FolderPlus className="size-4" />
        フォルダ
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>新しいサブフォルダを作成</DialogTitle>
          <DialogDescription>
            親フォルダ: <span className="font-mono text-xs">{parentPath === "/" ? "/" : parentPath}</span>
            <br />
            フォルダは最初の写真をアップロードした時点で作成されます。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="folder-name" className="text-xs text-muted-foreground">フォルダ名</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="結婚式"
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground">
              スラッシュを含めると一気に深い階層も作れます (例: 旅行/京都)
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              <ImageUp className="size-4" />
              作成してアップロードへ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
