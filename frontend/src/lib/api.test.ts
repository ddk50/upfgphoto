import { afterEach, describe, expect, it, vi } from "vitest"
import { api } from "./api"

// 書き込み API が CSRF トークンを自動付与すること (mutate ヘルパー経由)。
// サーバ側の強制 (422) は backend 側の設定なので、ここでは「送る側」を固定する
describe("書き込み API の X-CSRF-Token", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("トークン未取得なら /api/v1/me から取得して付与する", async () => {
    const calls: { url: string; init?: RequestInit }[] = []
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init })
        if (url === "/api/v1/me") {
          return new Response(JSON.stringify({ csrf: "tok-1", status: "anonymous" }), {
            status: 200,
          })
        }
        return new Response(null, { status: 204 })
      }),
    )

    await api.deletePhoto("42")

    const del = calls.find((c) => c.url === "/api/v1/photos/42")
    expect(del).toBeDefined()
    expect(del?.init?.method).toBe("DELETE")
    expect((del?.init?.headers as Record<string, string>)["X-CSRF-Token"]).toBe("tok-1")
  })
})
