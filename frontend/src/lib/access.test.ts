import { describe, expect, it } from "vitest"
import type { AccessRuleMap, FolderOwnerMap, UserRole } from "@/types"
import { canEditAccess, findRestrictedAncestorSources } from "./access"

/**
 * ADR-019「公開設定の編集権と隷属ルール」の実行可能な仕様書。
 *
 * 登場人物: A (u_a) / B (u_b) / C (u_c)。デフォルトオーナーは u_def。
 *
 * フォルダ構成とルール:
 *   /plain-a              owner A, ルールなし
 *   /plain-b              owner B, ルールなし
 *   /mine                 owner A, restricted (Aのゾーン)
 *   /mine/sub             owner B  (Bが実体化したがAのゾーン内)
 *   /foreign              owner B, restricted (Bのゾーン)
 *   /foreign/sub          owner A  (Aが実体化したがBのゾーン内)
 *   /foreign/open         owner B, everyone (Bによる上書き)
 *   /foreign/open/deep    owner A  (everyone の下でも隷属は解除されない)
 *   /nested               owner B, restricted
 *   /nested/inner         owner C, restricted (ネストした他人restricted)
 *   /nested/inner/leaf    owner A
 */
const DEFAULT_OWNER = "u_def"

const owners: FolderOwnerMap = {
  "/plain-a": "u_a",
  "/plain-b": "u_b",
  "/mine": "u_a",
  "/mine/sub": "u_b",
  "/foreign": "u_b",
  "/foreign/sub": "u_a",
  "/foreign/open": "u_b",
  "/foreign/open/deep": "u_a",
  "/nested": "u_b",
  "/nested/inner": "u_c",
  "/nested/inner/leaf": "u_a",
}

const rules: AccessRuleMap = {
  "/mine": { mode: "restricted", allowedUserIds: ["u_a", "u_b"] },
  "/foreign": { mode: "restricted", allowedUserIds: ["u_a", "u_b"] },
  "/foreign/open": { mode: "everyone" },
  "/nested": { mode: "restricted", allowedUserIds: ["u_b", "u_c"] },
  "/nested/inner": { mode: "restricted", allowedUserIds: ["u_c"] },
}

function can(path: string, userId: string, role: UserRole = "user"): boolean {
  return canEditAccess(path, role, owners, DEFAULT_OWNER, userId, rules)
}

describe("canEditAccess: ロール", () => {
  it("admin はどこでも編集できる（他人のネスト restricted 配下でも）", () => {
    expect(can("/nested/inner/leaf", "u_a", "admin")).toBe(true)
    expect(can("/foreign", "u_a", "admin")).toBe(true)
  })

  it("guest はどこも編集できない", () => {
    expect(can("/plain-a", "u_a", "guest")).toBe(false)
  })
})

describe("canEditAccess: restricted 祖先がない通常空間", () => {
  it("フォルダのオーナーは編集できる", () => {
    expect(can("/plain-a", "u_a")).toBe(true)
  })

  it("オーナーでなければ編集できない", () => {
    expect(can("/plain-b", "u_a")).toBe(false)
  })
})

describe("canEditAccess: 自分の restricted ゾーン", () => {
  it("restricted の source フォルダ自身をオーナーは編集できる（自分のルールは外せる）", () => {
    expect(can("/mine", "u_a")).toBe(true)
  })

  it("ゾーンの主は、他人がオーナーのサブフォルダでも編集できる（子で上書き可）", () => {
    expect(can("/mine/sub", "u_a")).toBe(true)
  })
})

describe("canEditAccess: 他人の restricted への無条件隷属", () => {
  it("他人の restricted 配下では、サブフォルダのオーナーでも編集できない", () => {
    expect(can("/foreign/sub", "u_a")).toBe(false)
  })

  it("自分がオーナーのサブフォルダをゾーンの主(B)は編集できる", () => {
    expect(can("/foreign/sub", "u_b")).toBe(true)
  })

  it("間に everyone の上書きがあっても隷属は解除されない（無条件隷属の肝）", () => {
    expect(can("/foreign/open/deep", "u_a")).toBe(false)
  })

  it("ゾーン内の非オーナー(サブフォルダを実体化した人)は自分のゾーンでない場所を編集できない", () => {
    expect(can("/mine/sub", "u_b")).toBe(false)
  })
})

describe("canEditAccess: ネストした他人の restricted", () => {
  it("A: 両方他人の restricted なので不可", () => {
    expect(can("/nested/inner/leaf", "u_a")).toBe(false)
  })

  it("B: 自分の /nested の下だが、他人(C)の /nested/inner が挟まるので不可", () => {
    expect(can("/nested/inner/leaf", "u_b")).toBe(false)
  })

  it("C: 自分の /nested/inner の下だが、他人(B)の /nested の配下なので不可", () => {
    expect(can("/nested/inner/leaf", "u_c")).toBe(false)
  })

  it("C は自分のルールの source (/nested/inner) すら外せない（Bのゾーン内のため）→ admin のみ", () => {
    expect(can("/nested/inner", "u_c")).toBe(false)
    expect(can("/nested/inner", "u_c", "admin")).toBe(true)
  })
})

describe("findRestrictedAncestorSources", () => {
  it("自身を含む祖先の restricted source を根から順に返す", () => {
    expect(findRestrictedAncestorSources("/nested/inner/leaf", rules)).toEqual([
      "/nested",
      "/nested/inner",
    ])
    expect(findRestrictedAncestorSources("/mine", rules)).toEqual(["/mine"])
  })

  it("everyone の上書きは restricted の存在を隠さない", () => {
    expect(findRestrictedAncestorSources("/foreign/open/deep", rules)).toEqual(["/foreign"])
  })

  it("restricted 祖先がなければ空", () => {
    expect(findRestrictedAncestorSources("/plain-a", rules)).toEqual([])
  })
})
