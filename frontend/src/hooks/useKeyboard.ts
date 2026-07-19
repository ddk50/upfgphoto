import { useEffect } from "react"

type Handlers = Partial<Record<string, () => void>>

export function useKeyboard(handlers: Handlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const fn = handlers[e.key]
      if (fn) {
        e.preventDefault()
        fn()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [handlers, enabled])
}
