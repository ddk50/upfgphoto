import { Link, NavLink } from "react-router-dom"
import { useUploadTarget } from "@/hooks/useUploadTarget"
import { ChartPie, ImageUp, Images, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserMenu } from "@/components/layout/UserMenu"
import { useSession } from "@/contexts/SessionContext"

type NavItem = { to: string; label: string; icon: typeof Images; end: boolean; adminOnly?: boolean }

const NAV: NavItem[] = [
  { to: "/", label: "ホーム", icon: Images, end: true },
  { to: "/upload", label: "アップロード", icon: ImageUp, end: false },
  { to: "/stats", label: "統計", icon: ChartPie, end: false },
  { to: "/admin/users", label: "ユーザ管理", icon: Shield, end: false, adminOnly: true },
]

// モバイルのナビはボトムバー (MobileActionBar) + アバターメニュー (UserMenu) に集約し、
// ハンバーガーメニューは持たない。このインラインナビはデスクトップ (md 以上) 専用
export function Header() {
  const { isAdmin } = useSession()

  // フォルダ閲覧中は「アップロード」を今いるフォルダ宛 (?to=) にする
  const uploadTo = useUploadTarget()

  const visibleNav = NAV.filter((n) => !n.adminOnly || isAdmin).map((n) =>
    n.to === "/upload" ? { ...n, to: uploadTo } : n,
  )

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b backdrop-blur-md transition-colors",
        isAdmin
          ? "border-red-200/70 bg-red-50/70"
          : "border-border/60 bg-background/80",
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-8 lg:px-16">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-tight">Uprun</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">Photos</span>
          </Link>
          {isAdmin && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800 ring-1 ring-red-200">
              <Shield className="size-3" />
              管理者モード
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-1">
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                    item.adminOnly && "text-red-700 hover:text-red-800",
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <UserMenu />
        </div>
      </div>
    </header>
  )
}
