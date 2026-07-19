import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, Globe, Link2, Loader2, Lock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useSession } from "@/contexts/SessionContext"
import { api, type AccessRuleView, type ApiUser } from "@/lib/api"
import { UserPicker } from "./UserPicker"
import { OverrideWarningDialog } from "./OverrideWarningDialog"
import { cn } from "@/lib/utils"

type Mode = "inherit" | "everyone" | "restricted" | "guest"

type AccessSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderPath: string
  isOwner: boolean
  // 保存成功後に呼ばれる (親ページの再取得用)
  onSaved: () => void
}

export function AccessSettingsDialog({
  open,
  onOpenChange,
  folderPath,
  isOwner,
  onSaved,
}: AccessSettingsDialogProps) {
  const { user, isAdmin } = useSession()
  const [view, setView] = useState<AccessRuleView | null>(null)
  const [users, setUsers] = useState<ApiUser[]>([])
  const [mode, setMode] = useState<Mode>("inherit")
  const [memberIds, setMemberIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setView(null)
    void Promise.all([api.accessRule(folderPath), api.users()])
      .then(([v, us]) => {
        setView(v)
        setMode(v.ownMode)
        setMemberIds(v.ownMode === "restricted" ? v.ownMemberIds : user ? [user.id] : [])
        setUsers(us)
      })
      .catch(() => {
        toast.error("公開設定の取得に失敗しました")
        onOpenChange(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, folderPath])

  const isAdminEditing = isAdmin && !isOwner
  const isRoot = folderPath === "/"
  const folderLabel = isRoot ? "ルート" : folderPath
  const lockedIds = user && !isAdminEditing ? [user.id] : []

  // ADR-007: inherit を選ぶと親の制限で自分が閲覧不能になるケースをブロック
  const ownerLockedOut =
    !isAdminEditing &&
    isOwner &&
    mode === "inherit" &&
    view?.parentEffective?.mode === "restricted" &&
    !!user &&
    !view.parentEffective.memberIds.includes(user.id)

  const doSave = async (clearDescendants: boolean) => {
    setSaving(true)
    try {
      const result = await api.saveAccessRule({
        path: folderPath,
        mode,
        memberIds,
        clearDescendants,
      })
      if (mode === "guest" && result.shareToken) {
        try {
          await navigator.clipboard.writeText(`${window.location.origin}/g/${result.shareToken}`)
          toast.success("共有URLを発行してコピーしました")
        } catch {
          toast.success("共有URLを発行しました")
        }
      } else {
        toast.success(`公開設定を更新しました${isAdminEditing ? "（管理者として）" : ""}`)
      }
      setOverrideOpen(false)
      onOpenChange(false)
      onSaved()
    } catch {
      toast.error("保存に失敗しました")
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => {
    if (ownerLockedOut || !view) return
    if (view.descendantRules.length > 0) {
      setOverrideOpen(true)
      return
    }
    void doSave(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>公開設定</DialogTitle>
          <DialogDescription>
            <span className="font-mono text-xs">{folderLabel}</span> の閲覧範囲を選びます。
          </DialogDescription>
        </DialogHeader>

        {!view ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <>
            {isAdminEditing && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  管理者としてオーナー以外のフォルダを編集しています。
                </div>
              </div>
            )}

            <fieldset disabled={saving} className="space-y-4">
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)}>
                {!isRoot && view.parentEffective && (
                  <ModeRow
                    value="inherit"
                    title={`親と同じ（${describeMode(view.parentEffective.mode, view.parentEffective.memberIds.length)}）`}
                    description={`継承元: ${view.parentEffective.source === "/" ? "ルート" : view.parentEffective.source}`}
                    icon={<Users className="size-4 text-muted-foreground" />}
                    selected={mode === "inherit"}
                  />
                )}
                <ModeRow
                  value="everyone"
                  title="全員に公開"
                  description="このフォルダ配下を全メンバーが閲覧可"
                  icon={<Globe className="size-4 text-muted-foreground" />}
                  selected={mode === "everyone"}
                />
                <ModeRow
                  value="restricted"
                  title="指定ユーザのみ"
                  description="チェックを入れたユーザだけが閲覧可"
                  icon={<Lock className="size-4 text-muted-foreground" />}
                  selected={mode === "restricted"}
                />
                <ModeRow
                  value="guest"
                  title="リンクで共有"
                  description="URLを知っている人なら誰でもアクセス可（ログイン不要）"
                  icon={<Link2 className="size-4 text-muted-foreground" />}
                  selected={mode === "guest"}
                />
              </RadioGroup>

              {mode === "restricted" && (
                <div className="space-y-2 pt-2">
                  {!isAdminEditing && (
                    <p className="text-xs text-muted-foreground">
                      オーナー（自分）は常に閲覧できます。他のユーザを選んでください。
                    </p>
                  )}
                  <UserPicker
                    users={users}
                    selectedIds={memberIds}
                    lockedIds={lockedIds}
                    onChange={setMemberIds}
                  />
                </div>
              )}

              {mode === "guest" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span>
                      配下のサブフォルダ（独立した公開設定が無いもの）もすべてリンクで共有されます。保存すると共有URLが発行されます。
                    </span>
                  </div>
                </div>
              )}

              {ownerLockedOut && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    親の制限により、継承するとあなた自身が閲覧できなくなります。別のモードを選んでください。
                  </div>
                </div>
              )}
            </fieldset>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button
                onClick={handleSave}
                disabled={ownerLockedOut || saving}
                className={cn(isAdminEditing && "bg-red-600 hover:bg-red-700 text-white")}
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>

      {view && (
        <OverrideWarningDialog
          open={overrideOpen}
          onOpenChange={setOverrideOpen}
          folderPath={folderPath}
          descendants={view.descendantRules}
          onOverride={() => void doSave(true)}
          onKeep={() => void doSave(false)}
        />
      )}
    </Dialog>
  )
}

function describeMode(mode: string, memberCount: number): string {
  if (mode === "everyone") return "全員に公開"
  if (mode === "restricted") return `${memberCount}人のみ`
  return "リンクで共有"
}

function ModeRow({
  value,
  title,
  description,
  icon,
  selected,
}: {
  value: string
  title: string
  description: string
  icon: React.ReactNode
  selected: boolean
}) {
  return (
    <Label
      htmlFor={`mode-${value}`}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
      }`}
    >
      <RadioGroupItem value={value} id={`mode-${value}`} className="mt-0.5" />
      <div className="flex-1 space-y-0.5">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Label>
  )
}
