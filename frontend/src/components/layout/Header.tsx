import { useState } from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import { ChartPie, Menu, ImageUp, Images, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { UserMenu } from "@/components/layout/UserMenu"
import { useSession } from "@/contexts/SessionContext"
import { normalizeFolderPath } from "@/lib/path"

type NavItem = { to: string; label: string; icon: typeof Images; end: boolean; adminOnly?: boolean }

const NAV: NavItem[] = [
  { to: "/", label: "ホーム", icon: Images, end: true },
  { to: "/upload", label: "アップロード", icon: ImageUp, end: false },
  { to: "/stats", label: "統計", icon: ChartPie, end: false },
  { to: "/admin/users", label: "ユーザ管理", icon: Shield, end: false, adminOnly: true },
]

export function Header() {
  const { isAdmin } = useSession()
  const location = useLocation()
  // モバイルメニュー (Sheet)。リンクタップで明示的に閉じる — 閉じないと
  // 遷移がぼかしの背後で起きて「押しても無反応」に見える
  const [menuOpen, setMenuOpen] = useState(false)

  // フォルダ閲覧中は「アップロード」を今いるフォルダ宛 (?to=) にする
  let uploadTo = "/upload"
  if (location.pathname.startsWith("/folders")) {
    const folderPath = normalizeFolderPath(
      decodeURIComponent(location.pathname.slice("/folders".length)) || "/",
    )
    if (folderPath !== "/") uploadTo = `/upload?to=${encodeURIComponent(folderPath)}`
  }

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

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="メニューを開く">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>メニュー</SheetTitle>
              </SheetHeader>
              <nav className="mt-2 flex flex-col gap-1 px-2">
                {visibleNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "inline-flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                        item.adminOnly && "text-red-700 hover:text-red-800",
                      )
                    }
                  >
                    <item.icon className="size-5" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
