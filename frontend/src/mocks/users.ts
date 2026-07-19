import type { User } from "@/types"

export const MOCK_USERS: User[] = [
  { id: "u_me",     email: "kazushi@example.com",   name: "Kazushi",   avatarUrl: "https://picsum.photos/seed/u_me/96/96",    role: "user",  joinedAt: "2023-01-15T10:00:00+09:00", status: "approved" },
  { id: "u_taro",   email: "taro@example.com",      name: "太郎",       avatarUrl: "https://picsum.photos/seed/u_taro/96/96",  role: "user",  joinedAt: "2023-02-08T14:20:00+09:00", banned: true, status: "approved" },
  { id: "u_hana",   email: "hana@example.com",      name: "花",         avatarUrl: "https://picsum.photos/seed/u_hana/96/96",  role: "user",  joinedAt: "2023-03-21T09:45:00+09:00", status: "approved" },
  { id: "u_ken",    email: "ken@example.com",       name: "ケン",       avatarUrl: "https://picsum.photos/seed/u_ken/96/96",   role: "user",  joinedAt: "2023-05-02T16:10:00+09:00", expiresAt: "2026-10-12T23:59:59+09:00", status: "approved" },
  { id: "u_mei",    email: "mei@example.com",       name: "Mei",       avatarUrl: "https://picsum.photos/seed/u_mei/96/96",   role: "user",  joinedAt: "2023-06-14T11:30:00+09:00", expiresAt: "2026-05-01T23:59:59+09:00", status: "approved" },
  { id: "u_yuki",   email: "yuki@example.com",      name: "ユキ",       avatarUrl: "https://picsum.photos/seed/u_yuki/96/96",  role: "user",  joinedAt: "2023-08-09T08:00:00+09:00", status: "approved" },
  { id: "u_sho",    email: "sho@example.com",       name: "翔",         avatarUrl: "https://picsum.photos/seed/u_sho/96/96",   role: "user",  joinedAt: "2023-10-22T19:55:00+09:00", status: "approved" },
  { id: "u_riko",   email: "riko@example.com",      name: "リコ",       avatarUrl: "https://picsum.photos/seed/u_riko/96/96",  role: "user",  joinedAt: "2024-01-04T12:15:00+09:00", status: "approved" },
  { id: "u_newcomer", email: "newcomer@example.com", name: "審査中のユーザ", avatarUrl: "https://picsum.photos/seed/u_newcomer/96/96", role: "user", joinedAt: "2026-06-04T09:00:00+09:00", status: "pending" },
]

export const CURRENT_USER_ID = "u_me"

export const GUEST_UPLOADER_ID = "guest_anonymous"
