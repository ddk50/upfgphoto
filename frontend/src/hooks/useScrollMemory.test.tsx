// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { useScrollMemory } from "./useScrollMemory"

// jsdom はレイアウト/スクロールを持たないので、window スクロールを自前でモデル化する。
// - scrollY は可変変数 y を読む
// - scrollTo(_, top) は y を更新し scroll イベントを発火 (実ブラウザの programmatic scroll と同じ)
// - setScroll は「ユーザースクロール」も「ローダー潰れによる clamp」も同じ経路で表現する
// - requestAnimationFrame は同期実行にして決定的にする
let y = 0
let scrollToSpy: ReturnType<typeof vi.fn>

function setScroll(v: number) {
  y = v
  window.dispatchEvent(new Event("scroll"))
}

beforeEach(() => {
  y = 0
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => y })
  scrollToSpy = vi.fn((...args: unknown[]) => {
    const top = typeof args[0] === "object" ? ((args[0] as ScrollToOptions).top ?? 0) : (args[1] as number)
    setScroll(top ?? 0)
  })
  window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0)
    return 0
  })
  vi.stubGlobal("cancelAnimationFrame", () => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

type Props = { key: string; ready: boolean }
function mount(initial: Props) {
  return renderHook(({ key, ready }: Props) => useScrollMemory(key, ready), {
    initialProps: initial,
  })
}

describe("useScrollMemory", () => {
  it("パンくずで戻ると元のスクロール位置に復元する (本命の回帰)", () => {
    // t1/a を開いてスクロール → 子 t1/b へ → パンくずで t1/a に戻る
    const { rerender } = mount({ key: "t1/a", ready: false })
    rerender({ key: "t1/a", ready: true }) // a 描画完了。保存なし → 先頭
    expect(y).toBe(0)

    setScroll(3000) // ユーザが a を下までスクロール

    // 子 b へ遷移。ローディング中に潰れて clamp が発火する
    rerender({ key: "t1/b", ready: false })
    setScroll(0) // ← この clamp が a=0 として保存されるのが以前のバグ
    rerender({ key: "t1/b", ready: true }) // b 描画完了 → 先頭
    expect(y).toBe(0)

    setScroll(1200) // b を少しスクロール

    // パンくずで a に戻る。ここでも clamp が起きる
    rerender({ key: "t1/a", ready: false })
    setScroll(0) // ← clamp。a=3000 を上書きしてはいけない
    rerender({ key: "t1/a", ready: true }) // a 再描画完了 → 3000 に復元されるべき

    expect(y).toBe(3000)
  })

  it("未訪問の子フォルダへ入ると先頭から表示する", () => {
    const { rerender } = mount({ key: "t2/a", ready: false })
    rerender({ key: "t2/a", ready: true })
    setScroll(2000) // 親をスクロール

    rerender({ key: "t2/c", ready: false })
    setScroll(0) // clamp
    rerender({ key: "t2/c", ready: true }) // 初訪問 → 先頭

    expect(y).toBe(0)
  })

  it("同一フォルダの再ロード (削除・フィルタ) ではスクロールを動かさない", () => {
    const { rerender } = mount({ key: "t3/a", ready: false })
    rerender({ key: "t3/a", ready: true })
    setScroll(1500)
    const callsBefore = scrollToSpy.mock.calls.length

    // ライトボックス削除などで load() が走り ready が false→true するが key は同じ
    rerender({ key: "t3/a", ready: false })
    rerender({ key: "t3/a", ready: true })

    expect(scrollToSpy.mock.calls.length).toBe(callsBefore) // 復元 (scrollTo) は呼ばれない
    expect(y).toBe(1500) // 位置は維持
  })

  it("ローディング中 (ready=false) の clamp スクロールは保存されない", () => {
    // t4/a に 800 まで行った状態を作り、ローディング中の 0 clamp を挟んでから戻る
    const { rerender } = mount({ key: "t4/a", ready: false })
    rerender({ key: "t4/a", ready: true })
    setScroll(800)

    rerender({ key: "t4/x", ready: false })
    setScroll(0) // clamp (保存されてはいけない)
    setScroll(9999) // ローディング中の別の scroll も保存されてはいけない
    rerender({ key: "t4/x", ready: true })

    // t4/a に戻ると 800 が生きている
    rerender({ key: "t4/a", ready: false })
    setScroll(0)
    rerender({ key: "t4/a", ready: true })
    expect(y).toBe(800)
  })
})
