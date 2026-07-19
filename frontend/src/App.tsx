import { useEffect } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Header } from "@/components/layout/Header"
import { PhotoLibraryProvider, usePhotoLibrary } from "@/contexts/PhotoLibraryContext"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

export function RootShell() {
  return (
    <PhotoLibraryProvider>
      <TooltipProvider delayDuration={200}>
        <Outlet />
        <Toaster position="top-center" richColors />
      </TooltipProvider>
    </PhotoLibraryProvider>
  )
}

function App() {
  const { viewAsRole } = usePhotoLibrary()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (viewAsRole === "pending" && location.pathname !== "/pending") {
      navigate("/pending", { replace: true })
    }
  }, [viewAsRole, location.pathname, navigate])

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
