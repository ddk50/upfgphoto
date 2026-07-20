import { NavLink } from "react-router-dom"
import { Images, ImageUp, Search } from "lucide-react"
import { useUploadTarget } from "@/hooks/useUploadTarget"
import { cn } from "@/lib/utils"

// モバイル専用の下部フローティングバー (iPhone 写真アプリの下部バー風のガラス表現)。
// アップロードをハンバーガー経由なしの1タップに。統計・ユーザ管理はメニュー側のまま
export function MobileActionBar() {
  const uploadTo = useUploadTarget()

  return (
    <nav
      aria-label="クイックアクション"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden"
    >
      {/* ガラス感: iPhone 写真アプリ相当の強い透過。輪郭はぼかしとごく薄い縁だけで出す */}
      <div className="flex items-center gap-1 rounded-full border border-white/20 bg-background/15 p-1 shadow-sm backdrop-blur-2xl">
        <BarLink to="/" end label="ホーム">
          <Images className="size-5" />
        </BarLink>

        {/* 中央のアップロードだけプライマリ強調 */}
        <NavLink
          to={uploadTo}
          aria-label="アップロード"
          className={({ isActive }) =>
            cn(
              "flex size-11 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-sm transition-transform active:scale-95",
              isActive && "ring-2 ring-ring ring-offset-2 ring-offset-background",
            )
          }
        >
          <ImageUp className="size-5" />
        </NavLink>

        <BarLink to="/search" label="検索">
          <Search className="size-5" />
        </BarLink>
      </div>
    </nav>
  )
}

function BarLink({
  to,
  end,
  label,
  children,
}: {
  to: string
  end?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      className={({ isActive }) =>
        cn(
          "flex size-10 items-center justify-center rounded-full transition-colors",
          // 現在地は明確な反転表示 (強透過バーの上でも視認できる濃度にする)
          isActive ? "bg-foreground/80 text-background" : "text-foreground/70 active:bg-background/40",
        )
      }
    >
      {children}
    </NavLink>
  )
}
