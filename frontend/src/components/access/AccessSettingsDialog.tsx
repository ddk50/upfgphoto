import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, Check, Copy, Globe, Link2, Lock, RefreshCw, Shield, Users } from "lucide-react"
import type { AccessRule } from "@/types"
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
import { Input } from "@/components/ui/input"
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"
import { UserPicker } from "./UserPicker"
import { OverrideWarningDialog } from "./OverrideWarningDialog"
import { parentPath } from "@/lib/path"
import { generateShareToken } from "@/lib/token"
import { cn } from "@/lib/utils"

type Mode = "inherit" | "everyone" | "restricted" | "guest"

type AccessSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderPath: string
}

export function AccessSettingsDialog({ open, onOpenChange, folderPath }: AccessSettingsDialogProps) {
  const {
    users,
    currentUser,
    getOwnRule,
    resolveAccess,
    setAccessRule,
    viewAsRole,
    isOwner,
    getFolderOwner,
    findDescendantRules,
    clearDescendantRules,
    findNode,
  } = usePhotoLibrary()
  const own = getOwnRule(folderPath)
  const parent = parentPath(folderPath)
  const parentEffective = useMemo(
    () => (parent !== null ? resolveAccess(parent) : null),
    [parent, resolveAccess],
  )

  const ownsThis = isOwner(folderPath)
  const owner = getFolderOwner(folderPath)
  const isAdminEditing = viewAsRole === "admin"
  const isReadOnly = !isAdminEditing && !ownsThis

  const [mode, setMode] = useState<Mode>(own.mode)
  const [allowedIds, setAllowedIds] = useState<string[]>(
    own.mode === "restricted" ? own.allowedUserIds : [currentUser.id],
  )
  const [shareToken, setShareToken] = useState<string>(
    own.mode === "guest" ? own.shareToken : "",
  )
  const [copied, setCopied] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [pendingRule, setPendingRule] = useState<AccessRule | null>(null)

  const descendantRules = useMemo(
    () => findDescendantRules(folderPath),
    [findDescendantRules, folderPath],
  )

  const subFolderCount = useMemo(() => {
    const node = findNode(folderPath)
    if (!node) return 0
    let count = 0
    const walk = (n: typeof node) => {
      count += n.children.length
      n.children.forEach(walk)
    }
    walk(node)
    return count
  }, [findNode, folderPath])

  useEffect(() => {
    if (open) {
      setMode(own.mode)
      setAllowedIds(own.mode === "restricted" ? own.allowedUserIds : [currentUser.id])
      setShareToken(own.mode === "guest" ? own.shareToken : "")
      setCopied(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, folderPath])

  // generate token lazily when guest mode is chosen for the first time
  useEffect(() => {
    if (mode === "guest" && !shareToken) {
      setShareToken(generateShareToken())
    }
  }, [mode, shareToken])

  const isRoot = folderPath === "/"
  const folderLabel = folderPath === "/" ? "ルート" : folderPath

  const shareUrl = shareToken ? `${window.location.origin}/g/${shareToken}` : ""

  // owner self-lock prevention: when not admin AND inherit mode, check parent's resolved access
  const ownerLockedOut = useMemo(() => {
    if (isAdminEditing) return false
    if (!ownsThis) return false
    if (mode !== "inherit") return false
    if (!parentEffective) return false
    if (parentEffective.mode === "restricted") {
      return !parentEffective.allowedUserIds.includes(currentUser.id)
    }
    return false
  }, [isAdminEditing, ownsThis, mode, parentEffective, currentUser.id])

  const buildRule = (): AccessRule => {
    if (mode === "inherit") return { mode: "inherit" }
    if (mode === "everyone") return { mode: "everyone" }
    if (mode === "restricted") {
      const ids = allowedIds.includes(currentUser.id) || isAdminEditing
        ? allowedIds
        : [currentUser.id, ...allowedIds]
      return { mode: "restricted", allowedUserIds: ids }
    }
    return { mode: "guest", shareToken: shareToken || generateShareToken() }
  }

  const commitSave = (rule: AccessRule, withOverride: boolean) => {
    if (withOverride) {
      clearDescendantRules(folderPath)
    }
    setAccessRule(folderPath, rule)
    toast.success(
      `公開設定を更新しました${isAdminEditing && !ownsThis ? "（管理者として）" : ""}${withOverride ? "（サブフォルダの独立設定を上書き）" : ""}`,
      {
        description: `${folderLabel}（モックなので実際の保存は行っていません）`,
      },
    )
    onOpenChange(false)
    setOverrideOpen(false)
    setPendingRule(null)
  }

  const handleSave = () => {
    if (ownerLockedOut) return
    const rule = buildRule()
    if (descendantRules.length > 0) {
      setPendingRule(rule)
      setOverrideOpen(true)
      return
    }
    commitSave(rule, false)
  }

  const regenerateToken = () => {
    setShareToken(generateShareToken())
    setCopied(false)
  }

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success("共有URLをコピーしました")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("コピーに失敗しました")
    }
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

        {isAdminEditing && !ownsThis && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-1">
                <div className="font-medium">管理者として編集中</div>
                <div className="text-red-700/90">
                  本来このフォルダのオーナーは{" "}
                  <span className="inline-flex items-center gap-1 align-middle">
                    <img src={owner.avatarUrl} alt={owner.name} className="size-4 rounded-full" />
                    {owner.name}
                  </span>{" "}
                  です。
                </div>
              </div>
            </div>
          </div>
        )}

        {isReadOnly && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              閲覧のみ表示しています。オーナー（{owner.name}）または管理者だけが変更できます。
            </div>
          </div>
        )}

        <fieldset disabled={isReadOnly} className="space-y-4">
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)}>
            {!isRoot && parentEffective && (
              <ModeRow
                value="inherit"
                title={`親と同じ（${describeEffective(parentEffective)}）`}
                description={`継承元: ${parentEffective.source === "/" ? "ルート" : parentEffective.source}`}
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
                selectedIds={
                  isAdminEditing
                    ? allowedIds
                    : allowedIds.includes(currentUser.id)
                      ? allowedIds
                      : [currentUser.id, ...allowedIds]
                }
                currentUserId={isAdminEditing ? "__never_lock__" : currentUser.id}
                onChange={setAllowedIds}
              />
            </div>
          )}

          {mode === "guest" && subFolderCount > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  このフォルダの下のサブフォルダ <span className="font-medium">{subFolderCount} 件</span> もリンクで共有されます（独立した公開設定が無いサブフォルダのみ）。
                </span>
              </div>
            </div>
          )}

          {mode === "guest" && (
            <div className="space-y-2 pt-2">
              <Label className="text-xs text-muted-foreground">共有URL</Label>
              <div className="flex items-center gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyShareUrl}
                  aria-label="コピー"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  URLを知っている人なら誰でも閲覧・アップロードできます。
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={regenerateToken}
                  className="h-7 text-xs"
                >
                  <RefreshCw className="size-3" />
                  再生成
                </Button>
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
            {isReadOnly ? "閉じる" : "キャンセル"}
          </Button>
          {!isReadOnly && (
            <Button
              onClick={handleSave}
              disabled={ownerLockedOut}
              className={cn(
                isAdminEditing && !ownsThis && "bg-red-600 hover:bg-red-700 text-white",
              )}
            >
              保存
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {pendingRule && (
        <OverrideWarningDialog
          open={overrideOpen}
          onOpenChange={(o) => {
            setOverrideOpen(o)
            if (!o) setPendingRule(null)
          }}
          folderPath={folderPath}
          descendants={descendantRules}
          onOverride={() => commitSave(pendingRule, true)}
          onKeep={() => commitSave(pendingRule, false)}
        />
      )}
    </Dialog>
  )
}

function describeEffective(eff: { mode: string; allowedUserIds: string[] }): string {
  if (eff.mode === "everyone") return "全員に公開"
  if (eff.mode === "restricted") return `${eff.allowedUserIds.length}人のみ`
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
