import type { StorageInfo } from "@/types"

const GB = 1024 * 1024 * 1024

export const MOCK_STORAGE: StorageInfo = {
  totalBytes: 500 * GB,
  usedBytes: Math.floor(327.4 * GB),
}
