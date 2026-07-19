import { useCallback, useState } from "react"

export type PhotoView = "grid" | "list"

// 表示モードは端末ごとの UI 好みなのでサーバ同期せず localStorage に保持する
const STORAGE_KEY = "uprun:photoView"

export function usePhotoView(): [PhotoView, (view: PhotoView) => void] {
  const [view, setView] = useState<PhotoView>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "list" ? "list" : "grid"
    } catch {
      return "grid"
    }
  })

  const change = useCallback((next: PhotoView) => {
    setView(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // プライベートモード等で保存できなくても表示切り替え自体は機能させる
    }
  }, [])

  return [view, change]
}
