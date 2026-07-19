import { useNavigate } from "react-router-dom"
import {
  Shield, User as UserIcon, ExternalLink, ChevronDown,
  Images, Folder, LogOut, Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession } from "@/contexts/SessionContext"
import { cn } from "@/lib/utils"

export function UserMenu() {
  const { user, isAdmin, logout } = useSession()
  const navigate = useNavigate()
  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2 rounded-full px-1 pr-2.5"
          aria-label="アカウント"
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="size-7 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-7 items-center justify-center rounded-full bg-muted">
              <UserIcon className="size-4 text-muted-foreground" />
            </span>
          )}
          <span
            className={cn(
              "hidden md:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
              isAdmin ? "bg-red-100 text-red-800" : "bg-muted text-muted-foreground",
            )}
          >
            {isAdmin ? <Shield className="size-3" /> : <UserIcon className="size-3" />}
            {user.name}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 px-2 py-2">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              <UserIcon className="size-5 text-muted-foreground" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="truncate text-xs text-muted-foreground">@{user.nickname}</div>
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
        <DropdownMenuItem onClick={() => navigate("/trash")}>
          <Trash2 className="size-4 text-muted-foreground" />
          ゴミ箱
          <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem onClick={() => navigate("/admin/users")}>
            <Shield className="size-4 text-red-600" />
            ユーザ管理
            <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void logout()}>
          <LogOut className="size-4 text-muted-foreground" />
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
