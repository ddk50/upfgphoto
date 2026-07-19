import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { api, type Me } from "@/lib/api"

export type SessionUser = {
  id: number
  name: string
  nickname: string
  avatarUrl: string | null
  role: "admin" | "user"
  status: "approved" | "pending"
}

type Session = {
  loading: boolean
  csrf: string
  status: "anonymous" | "approved" | "pending"
  user: SessionUser | null
  isAdmin: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
  devLogin: (userId: number) => Promise<void>
}

const SessionContext = createContext<Session | null>(null)

function toUser(me: Me): SessionUser | null {
  if (me.status === "anonymous") return null
  return {
    id: me.id,
    name: me.name,
    nickname: me.nickname,
    avatarUrl: me.avatar_url,
    role: me.role,
    status: me.status,
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<Me | null>(null)

  const refresh = useCallback(async () => {
    try {
      setMe(await api.me())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<Session>(() => {
    const user = me ? toUser(me) : null
    return {
      loading,
      csrf: me?.csrf ?? "",
      status: user ? user.status : "anonymous",
      user,
      isAdmin: user?.role === "admin" && user.status === "approved",
      refresh,
      logout: async () => {
        await api.logout()
        await refresh()
      },
      devLogin: async (userId: number) => {
        await api.devLogin(userId)
        await refresh()
      },
    }
  }, [loading, me, refresh])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): Session {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be used within SessionProvider")
  return ctx
}
