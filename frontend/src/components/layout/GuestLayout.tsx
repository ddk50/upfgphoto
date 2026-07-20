import { Outlet } from "react-router-dom"
import { Link2 } from "lucide-react"
import { BrandLogo } from "@/components/layout/BrandLogo"

export function GuestLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground antialiased">
      <header className="sticky top-0 z-30 border-b border-blue-200/70 bg-blue-50/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-8 lg:px-16">
          <div className="flex items-center">
            <BrandLogo className="h-5 w-auto sm:h-6" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs text-blue-800 ring-1 ring-blue-200">
            <Link2 className="size-3" />
            限定リンクで共有されたフォルダ
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-16 py-6 sm:py-10">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-16 py-8 text-center text-xs text-muted-foreground">
        URLを知っている人のみがアクセスできます。共有時はご注意ください。
      </footer>
    </div>
  )
}
