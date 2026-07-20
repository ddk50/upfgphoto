import { useLocation } from "react-router-dom"
import { normalizeFolderPath } from "@/lib/path"

// アップロード導線の宛先。フォルダ閲覧中は「今いるフォルダ宛 (?to=)」にする。
// Header とモバイルのアクションバーで共用 (ロジックを二重に持たない)
export function useUploadTarget(): string {
  const location = useLocation()
  if (location.pathname.startsWith("/folders")) {
    const folderPath = normalizeFolderPath(
      decodeURIComponent(location.pathname.slice("/folders".length)) || "/",
    )
    if (folderPath !== "/") return `/upload?to=${encodeURIComponent(folderPath)}`
  }
  return "/upload"
}
