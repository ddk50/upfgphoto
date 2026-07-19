import type { FolderOwnerMap } from "@/types"

export const DEFAULT_OWNER_ID = "u_me"

// first-creator オーナーシップ (ADR-019) のデモ用シード。
// 「自分のフォルダだが他人の restricted ゾーン内 → 公開設定が隷属ロック」が見えるように、
// 他人の restricted (access.ts) の配下に自分所有のサブフォルダを配置してある。
export const INITIAL_FOLDER_OWNERS: FolderOwnerMap = {
  // 花のゾーン: /2024/旅行/沖縄 は restricted
  "/2024/旅行/沖縄": "u_hana",
  "/2024/旅行/沖縄/ドライブ": "u_me", // 自分が実体化 → 花の制限に隷属

  // ケンのゾーン: /2023/イベント は restricted (結婚式はケン自身の子上書き)
  "/2023/イベント": "u_ken",
  "/2023/イベント/結婚式": "u_ken",
  "/2023/イベント/誕生日": "u_me", // 自分が実体化 → ケンの制限に隷属

  // 他人所有だが制限なし → 隷属ではなく通常の「オーナーのみ編集可」のケース
  "/2023/風景": "u_yuki",
}
