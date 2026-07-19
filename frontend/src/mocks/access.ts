import type { AccessRuleMap } from "@/types"

export const SAMPLE_GUEST_TOKEN = "Xn4qP2vKj8tLm5yBfH3wEa"

export const INITIAL_ACCESS_RULES: AccessRuleMap = {
  "/": { mode: "everyone" },
  "/2024/旅行/沖縄": { mode: "restricted", allowedUserIds: ["u_me", "u_taro", "u_hana", "u_mei"] },
  // ケンのゾーン: 配下の 結婚式/誕生日 はこの制限に隷属する (ADR-019)
  "/2023/イベント": { mode: "restricted", allowedUserIds: ["u_me", "u_ken", "u_sho", "u_riko"] },
  // ゾーンの主 (ケン) 自身による子上書きの例
  "/2023/イベント/結婚式": { mode: "restricted", allowedUserIds: ["u_me", "u_taro", "u_ken", "u_sho", "u_riko"] },
  "/2024/日常": { mode: "guest", shareToken: SAMPLE_GUEST_TOKEN },
}
