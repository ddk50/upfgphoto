import { useEffect, useRef } from "react"

// SPA セッション内で「画面キーごとの window スクロール位置」を覚えるストア。
// フルリロードで消えるのは許容 (直リンクで深いフォルダを開いたら先頭が自然)。
const positions = new Map<string, number>()

/**
 * key ごとに window のスクロール位置を記憶し、ready になったら復元する。
 *
 * FolderPage は内容を非同期ロードしており、ロード中はローダーだけの短いページに潰れる。
 * その瞬間ブラウザがスクロールを先頭へクランプする → これが「戻ると先頭に戻る」の原因。
 *
 * 罠が2つある。両方を activeKey で塞ぐ:
 *  1. 復元が早すぎる  → ready (内容描画済み) になるまで復元しない
 *  2. 保存が壊れる    → ローディング中の clamp スクロールを「戻り先の位置」として
 *     上書き保存してしまう。よって「表示が安定している間 (ready)」だけ保存する。
 *     activeKey が null の間 (=ローディング中) の scroll は一切保存しない。
 */
export function useScrollMemory(key: string, ready: boolean) {
  // 表示が安定している key。ready の間だけ非 null。scroll 保存はこの key に対してのみ行う
  const activeKeyRef = useRef<string | null>(null)

  useEffect(() => {
    // 復元は自前で行うのでブラウザ既定の復元は無効化 (二重処理・ちらつき防止)
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }
    let frame = 0
    const save = () => {
      frame = 0
      // ローディング中 (activeKey=null) の clamp スクロールは保存しない
      if (activeKeyRef.current !== null) {
        positions.set(activeKeyRef.current, window.scrollY)
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(save)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const restoredKey = useRef<string | null>(null)
  useEffect(() => {
    if (!ready) {
      // ローディング中は保存を止める (潰れたページの clamp を書き込ませない)
      activeKeyRef.current = null
      return
    }
    // key が変わって最初に ready になったときだけ復元する
    if (restoredKey.current !== key) {
      restoredKey.current = key
      window.scrollTo(0, positions.get(key) ?? 0)
    }
    // 以降この key のユーザースクロールを保存対象にする
    activeKeyRef.current = key
  }, [key, ready])
}
