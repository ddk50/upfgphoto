import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

type OverrideWarningDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderPath: string
  descendants: { path: string; mode: string }[]
  onOverride: () => void
  onKeep: () => void
}

function describeMode(mode: string): string {
  if (mode === "everyone") return "全員に公開"
  if (mode === "restricted") return "指定ユーザのみ"
  if (mode === "guest") return "リンクで共有"
  return "継承"
}

export function OverrideWarningDialog({
  open,
  onOpenChange,
  folderPath,
  descendants,
  onOverride,
  onKeep,
}: OverrideWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600" />
            サブフォルダの独立設定があります
          </DialogTitle>
          <DialogDescription>
            <span className="font-mono text-xs">{folderPath}</span> 配下に {descendants.length} 件の独立した公開設定があります。
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-56 rounded-xl border bg-card">
          <ul className="divide-y">
            {descendants.map((d) => (
              <li key={d.path} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="truncate font-mono text-xs">{d.path}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{describeMode(d.mode)}</span>
              </li>
            ))}
          </ul>
        </ScrollArea>

        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">上書きする</span>: サブフォルダの独立設定を全て解除し、親の設定に揃えます（guest 共有中のリンクは停止され台帳に記録されます）
          </p>
          <p>
            <span className="font-medium text-foreground">維持する</span>: サブフォルダの独立設定はそのままにし、このフォルダだけ更新します
          </p>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={onKeep}>
              維持する
            </Button>
            <Button variant="destructive" onClick={onOverride}>
              上書きする
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
