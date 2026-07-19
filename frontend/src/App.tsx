import { Outlet } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { SessionProvider, useSession } from "@/contexts/SessionContext"
import { LoginPage } from "@/pages/LoginPage"
import { PendingApprovalPage } from "@/pages/PendingApprovalPage"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

export function RootShell() {
  return (
    <SessionProvider>
      <TooltipProvider delayDuration={200}>
        <Outlet />
        <Toaster position="top-center" richColors />
      </TooltipProvider>
    </SessionProvider>
  )
}

function App() {
  const session = useSession()

  if (session.loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  if (session.status === "anonymous") return <LoginPage />
  if (session.status === "pending") return <PendingApprovalPage />

  return (
    <div className="min-h-svh bg-background text-foreground antialiased">
      <Header />
      <main className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-16 py-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}

export default App
