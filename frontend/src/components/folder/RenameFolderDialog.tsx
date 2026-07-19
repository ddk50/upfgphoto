import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Loader2, Pencil } from "lucide-react"
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
import { api, ApiError } from "@/lib/api"

type RenameFolderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderPath: string
  currentName: string
}

export function RenameFolderDialog({
  open,
  onOpenChange,
  folderPath,
  currentName,
}: RenameFolderDialogProps) {
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) setName(currentName)
  }, [open, currentName])

  const clean = name.trim()
  const invalid = !clean || clean.includes("/")
  const unchanged = clean === currentName

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (invalid || unchanged || saving) return
    setSaving(true)
    try {
      const { path } = await api.renameFolder(folderPath, clean)
      toast.success(`フォルダ名を「${clean}」に変更しました`)
      onOpenChange(false)
      navigate(`/folders${path}`, { replace: true })
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error("同じ階層に同名のフォルダが既に存在します")
      } else if (e instanceof ApiError && e.status === 403) {
        toast.error("このフォルダ名を変更する権限がありません")
      } else {
        toast.error("フォルダ名の変更に失敗しました")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>フォルダ名を変更</DialogTitle>
          <DialogDescription>
            対象: <span className="font-mono text-xs">{folderPath}</span>
            <br />
            配下のサブフォルダ・写真のパスもすべて追随します。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="rename-folder-name" className="text-xs text-muted-foreground">
              新しいフォルダ名
            </Label>
            <Input
              id="rename-folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            {clean.includes("/") && (
              <p className="text-[10px] text-destructive">フォルダ名にスラッシュは使えません</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={invalid || unchanged || saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
              変更する
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
