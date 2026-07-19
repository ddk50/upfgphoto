import type { ShareHistoryEntry } from "@/types"
import { SAMPLE_GUEST_TOKEN } from "./access"

export const INITIAL_SHARE_HISTORY: ShareHistoryEntry[] = [
  {
    token: SAMPLE_GUEST_TOKEN,
    path: "/2024/日常",
    issuedByName: "Kazushi",
    issuedAt: "2026-06-10T14:00:00+09:00",
  },
  {
    token: "aB3xR9kQm2nWc7pJt5vDl1",
    path: "/2024/旅行/沖縄",
    issuedByName: "花",
    issuedAt: "2026-05-02T10:00:00+09:00",
    stoppedAt: "2026-07-01T09:30:00+09:00",
    stoppedByName: "Kazushi",
    stoppedReason: "manual",
  },
  {
    token: "Zq8wN4hT6yUe0iSb2gVx9m",
    path: "/2023/イベント/結婚式",
    issuedByName: "ケン",
    issuedAt: "2026-04-18T19:00:00+09:00",
    stoppedAt: "2026-05-20T08:00:00+09:00",
    stoppedByName: "ケン",
    stoppedReason: "manual",
  },
]
