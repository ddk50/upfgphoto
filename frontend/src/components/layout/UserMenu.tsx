import { useNavigate } from "react-router-dom"
import {
  Check, Shield, User as UserIcon, Link2, ExternalLink, ChevronDown,
  Images, Clock, Folder,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"
import { SAMPLE_GUEST_TOKEN } from "@/mocks/access"
import type { ViewAsRole } from "@/types"
import { cn } from "@/lib/utils"

const ROLE_LABEL: Record<ViewAsRole, string> = {
  admin: "管理者",
  user: "通常ユーザ",
  guest: "ゲスト",
  pending: "承認待ち",
}

const ROLE_ICON: Record<ViewAsRole, typeof Shield> = {
  admin: Shield,
  user: UserIcon,
  guest: Link2,
  pending: Clock,
}

export function UserMenu() {
  const { currentUser, viewAsRole, setViewAsRole } = usePhotoLibrary()
  const navigate = useNavigate()
  const RoleIcon = ROLE_ICON[viewAsRole]

  const switchTo = (role: ViewAsRole) => {
    setViewAsRole(role)
    if (role === "guest") {
      navigate(`/g/${SAMPLE_GUEST_TOKEN}`)
    } else if (role === "pending") {
      navigate("/pending")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2 rounded-full px-1 pr-2.5"
          aria-label="アカウントとロール"
        >
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="size-7 rounded-full object-cover"
          />
          <span
            className={cn(
              "hidden md:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
              viewAsRole === "admin"
                ? "bg-red-100 text-red-800"
                : viewAsRole === "guest"
                  ? "bg-blue-100 text-blue-800"
                  : viewAsRole === "pending"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-muted text-muted-foreground",
            )}
          >
            <RoleIcon className="size-3" />
            {ROLE_LABEL[viewAsRole]}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 px-2 py-2">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="size-10 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{currentUser.name}</div>
            <div className="truncate text-xs text-muted-foreground">{currentUser.email}</div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/my-photos")}>
          <Images className="size-4 text-muted-foreground" />
          マイフォト
          <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/shared-folders")}>
          <Folder className="size-4 text-muted-foreground" />
          共有中のフォルダ
          <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          View as（モック）
        </DropdownMenuLabel>
        <RoleItem
          role="user"
          current={viewAsRole}
          onSelect={() => switchTo("user")}
          label="通常ユーザ"
          description="自分が所有するフォルダの公開設定だけ編集可"
        />
        <RoleItem
          role="admin"
          current={viewAsRole}
          onSelect={() => switchTo("admin")}
          label="管理者"
          description="任意のフォルダの設定変更、ユーザ管理"
        />
        <RoleItem
          role="guest"
          current={viewAsRole}
          onSelect={() => switchTo("guest")}
          label="ゲスト（限定リンク経由）"
          description="共有URLを開いたゲスト視点に切替"
        />
        <RoleItem
          role="pending"
          current={viewAsRole}
          onSelect={() => switchTo("pending")}
          label="承認待ち ユーザ"
          description="新規登録直後の体験（管理者承認待ち）"
        />
        {viewAsRole === "admin" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/admin/users")}>
              <Shield className="size-4 text-red-600" />
              ユーザ管理
              <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RoleItem({
  role,
  current,
  onSelect,
  label,
  description,
}: {
  role: ViewAsRole
  current: ViewAsRole
  onSelect: () => void
  label: string
  description: string
}) {
  const Icon = ROLE_ICON[role]
  const isCurrent = current === role
  return (
    <DropdownMenuItem onSelect={onSelect} className="flex items-start gap-2 py-2">
      <Icon
        className={cn(
          "mt-0.5 size-4",
          role === "admin"
            ? "text-red-600"
            : role === "guest"
              ? "text-blue-600"
              : role === "pending"
                ? "text-amber-600"
                : "text-muted-foreground",
        )}
      />
      <div className="flex-1 space-y-0.5">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      {isCurrent && <Check className="mt-0.5 size-4 text-foreground" />}
    </DropdownMenuItem>
  )
}
