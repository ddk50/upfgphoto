import type { Exif, Photo } from "@/types"

type Spec = {
  id: string
  path: string
  title: string
  takenAt: string
  exif?: Exif
  tags: string[]
  uploaderId?: string
}

const SPECS: Spec[] = [
  // /2024/旅行/京都
  { id: "kyo01", path: "/2024/旅行/京都/桜並木.jpg", title: "桜並木", takenAt: "2024-04-04T09:21:00+09:00",
    tags: ["旅行", "京都", "桜", "春", "風景"],
    exif: { camera: "Sony α7 IV", lens: "FE 24-70mm F2.8 GM II", focalLength: "35mm", aperture: "f/4.0", shutter: "1/500s", iso: 200 } },
  { id: "kyo02", path: "/2024/旅行/京都/清水寺.jpg", title: "清水寺", takenAt: "2024-04-04T14:02:00+09:00",
    tags: ["旅行", "京都", "寺社", "建築", "iPhone"],
    exif: { camera: "iPhone 15 Pro", focalLength: "24mm", aperture: "f/1.78", shutter: "1/1200s", iso: 64 } },
  { id: "kyo03", path: "/2024/旅行/京都/鴨川.jpg", title: "鴨川の夕暮れ", takenAt: "2024-04-04T17:48:00+09:00",
    tags: ["旅行", "京都", "川", "夕暮れ", "風景"] },
  { id: "kyo04", path: "/2024/旅行/京都/伏見稲荷.jpg", title: "伏見稲荷", takenAt: "2024-04-05T08:15:00+09:00",
    tags: ["旅行", "京都", "寺社", "朝", "建築"],
    exif: { camera: "Sony α7 IV", lens: "FE 16-35mm F2.8 GM", focalLength: "16mm", aperture: "f/8.0", shutter: "1/250s", iso: 100 } },
  { id: "kyo05", path: "/2024/旅行/京都/嵐山.jpg", title: "嵐山", takenAt: "2024-04-05T11:30:00+09:00",
    tags: ["旅行", "京都", "自然", "風景", "山"] },
  { id: "kyo06", path: "/2024/旅行/京都/竹林.jpg", title: "竹林の小径", takenAt: "2024-04-05T12:05:00+09:00",
    tags: ["旅行", "京都", "自然", "竹", "iPhone"],
    exif: { camera: "iPhone 15 Pro", focalLength: "13mm", aperture: "f/2.2", shutter: "1/180s", iso: 200 } },
  { id: "kyo07", path: "/2024/旅行/京都/和菓子.jpg", title: "和菓子", takenAt: "2024-04-05T15:40:00+09:00",
    tags: ["旅行", "京都", "グルメ", "和菓子"] },
  { id: "kyo08", path: "/2024/旅行/京都/夜景.jpg", title: "夜の祇園", takenAt: "2024-04-05T20:12:00+09:00",
    tags: ["旅行", "京都", "夜景", "街並み"],
    exif: { camera: "Sony α7 IV", lens: "FE 35mm F1.4 GM", focalLength: "35mm", aperture: "f/1.8", shutter: "1/60s", iso: 1600 } },

  // /2024/旅行/沖縄
  { id: "oki01", path: "/2024/旅行/沖縄/エメラルドビーチ.jpg", title: "エメラルドビーチ", takenAt: "2024-08-12T10:33:00+09:00",
    tags: ["旅行", "沖縄", "海", "夏", "風景"], uploaderId: "u_hana",
    exif: { camera: "Sony α7 IV", lens: "FE 24-70mm F2.8 GM II", focalLength: "24mm", aperture: "f/8.0", shutter: "1/1000s", iso: 100 } },
  { id: "oki02", path: "/2024/旅行/沖縄/首里城.jpg", title: "首里城", takenAt: "2024-08-12T15:20:00+09:00",
    tags: ["旅行", "沖縄", "建築", "歴史"], uploaderId: "u_hana" },
  { id: "oki03", path: "/2024/旅行/沖縄/サンセット.jpg", title: "サンセット", takenAt: "2024-08-12T18:55:00+09:00",
    tags: ["旅行", "沖縄", "海", "夕暮れ", "風景", "iPhone"], uploaderId: "u_hana",
    exif: { camera: "iPhone 15 Pro", focalLength: "24mm", aperture: "f/1.78", shutter: "1/500s", iso: 64 } },
  { id: "oki04", path: "/2024/旅行/沖縄/海中道路.jpg", title: "海中道路", takenAt: "2024-08-13T11:14:00+09:00",
    tags: ["旅行", "沖縄", "海", "ドライブ"], uploaderId: "u_hana" },
  { id: "oki05", path: "/2024/旅行/沖縄/ステーキ.jpg", title: "ステーキディナー", takenAt: "2024-08-13T19:48:00+09:00",
    tags: ["旅行", "沖縄", "グルメ", "ディナー", "iPhone"],
    exif: { camera: "iPhone 15 Pro", focalLength: "24mm", aperture: "f/1.78", shutter: "1/60s", iso: 320 } },
  { id: "oki06", path: "/2024/旅行/沖縄/朝の海.jpg", title: "朝の海", takenAt: "2024-08-14T06:22:00+09:00",
    tags: ["旅行", "沖縄", "海", "朝", "風景"] },

  // /2024/旅行/沖縄/ドライブ — 自分 (u_me) が実体化したサブフォルダ。
  // 花の restricted (/2024/旅行/沖縄) に隷属するデモ (ADR-019)
  { id: "okidr1", path: "/2024/旅行/沖縄/ドライブ/古宇利大橋.jpg", title: "古宇利大橋", takenAt: "2024-08-13T09:40:00+09:00",
    tags: ["旅行", "沖縄", "ドライブ", "橋", "海"] },
  { id: "okidr2", path: "/2024/旅行/沖縄/ドライブ/やちむんの里.jpg", title: "やちむんの里", takenAt: "2024-08-13T14:25:00+09:00",
    tags: ["旅行", "沖縄", "ドライブ", "工芸", "iPhone"],
    exif: { camera: "iPhone 15 Pro", focalLength: "24mm", aperture: "f/1.78", shutter: "1/240s", iso: 80 } },

  // /2024/日常
  { id: "day01", path: "/2024/日常/朝のコーヒー.jpg", title: "朝のコーヒー", takenAt: "2024-09-02T08:11:00+09:00",
    tags: ["日常", "コーヒー", "朝", "グルメ"] },
  { id: "day02", path: "/2024/日常/愛猫.jpg", title: "愛猫", takenAt: "2024-09-08T13:30:00+09:00",
    tags: ["日常", "猫", "ペット", "iPhone"],
    exif: { camera: "iPhone 15 Pro", focalLength: "24mm", aperture: "f/1.78", shutter: "1/120s", iso: 200 } },
  { id: "day03", path: "/2024/日常/夜の散歩.jpg", title: "夜の散歩", takenAt: "2024-09-15T20:42:00+09:00",
    tags: ["日常", "夜景", "街並み"] },
  { id: "day04", path: "/2024/日常/週末のパスタ.jpg", title: "週末のパスタ", takenAt: "2024-09-22T12:45:00+09:00",
    tags: ["日常", "グルメ", "パスタ", "料理"] },
  { id: "day05", path: "/2024/日常/植物.jpg", title: "ベランダの植物", takenAt: "2024-10-01T09:30:00+09:00",
    tags: ["日常", "植物", "自然"],
    exif: { camera: "Sony α7 IV", lens: "FE 90mm F2.8 Macro G OSS", focalLength: "90mm", aperture: "f/4.0", shutter: "1/250s", iso: 200 } },
  { id: "day06", path: "/2024/日常/カフェ.jpg", title: "近所のカフェ", takenAt: "2024-10-12T15:05:00+09:00",
    tags: ["日常", "カフェ", "グルメ"], uploaderId: "guest_anonymous" },
  { id: "day07", path: "/2024/日常/読書.jpg", title: "読書の時間", takenAt: "2024-10-20T21:15:00+09:00",
    tags: ["日常", "読書", "iPhone"], uploaderId: "guest_anonymous",
    exif: { camera: "iPhone 15 Pro", focalLength: "24mm", aperture: "f/1.78", shutter: "1/30s", iso: 800 } },

  // /2023/イベント/結婚式
  { id: "wed01", path: "/2023/イベント/結婚式/会場.jpg", title: "結婚式会場", takenAt: "2023-06-10T11:00:00+09:00",
    tags: ["イベント", "結婚式", "建築"], uploaderId: "u_ken",
    exif: { camera: "Sony α7 IV", lens: "FE 24-70mm F2.8 GM II", focalLength: "24mm", aperture: "f/4.0", shutter: "1/200s", iso: 400 } },
  { id: "wed02", path: "/2023/イベント/結婚式/新郎新婦.jpg", title: "新郎新婦", takenAt: "2023-06-10T11:45:00+09:00",
    tags: ["イベント", "結婚式", "人物"], uploaderId: "u_ken",
    exif: { camera: "Sony α7 IV", lens: "FE 85mm F1.4 GM", focalLength: "85mm", aperture: "f/2.0", shutter: "1/400s", iso: 200 } },
  { id: "wed03", path: "/2023/イベント/結婚式/乾杯.jpg", title: "乾杯", takenAt: "2023-06-10T13:20:00+09:00",
    tags: ["イベント", "結婚式", "ディナー"], uploaderId: "u_ken" },
  { id: "wed04", path: "/2023/イベント/結婚式/ケーキ.jpg", title: "ウェディングケーキ", takenAt: "2023-06-10T15:10:00+09:00",
    tags: ["イベント", "結婚式", "ケーキ", "グルメ"], uploaderId: "u_ken" },
  { id: "wed05", path: "/2023/イベント/結婚式/退場.jpg", title: "退場シーン", takenAt: "2023-06-10T17:00:00+09:00",
    tags: ["イベント", "結婚式", "人物"], uploaderId: "u_ken",
    exif: { camera: "Sony α7 IV", lens: "FE 24-70mm F2.8 GM II", focalLength: "50mm", aperture: "f/2.8", shutter: "1/250s", iso: 800 } },

  // /2023/イベント/誕生日
  { id: "bday01", path: "/2023/イベント/誕生日/ケーキ.jpg", title: "バースデーケーキ", takenAt: "2023-11-03T19:30:00+09:00",
    tags: ["イベント", "誕生日", "ケーキ", "グルメ"] },
  { id: "bday02", path: "/2023/イベント/誕生日/友人と.jpg", title: "友人と", takenAt: "2023-11-03T20:00:00+09:00",
    tags: ["イベント", "誕生日", "人物", "iPhone"],
    exif: { camera: "iPhone 15 Pro", focalLength: "24mm", aperture: "f/1.78", shutter: "1/60s", iso: 400 } },
  { id: "bday03", path: "/2023/イベント/誕生日/プレゼント.jpg", title: "プレゼント開封", takenAt: "2023-11-03T20:45:00+09:00",
    tags: ["イベント", "誕生日"] },
  { id: "bday04", path: "/2023/イベント/誕生日/乾杯.jpg", title: "シャンパン乾杯", takenAt: "2023-11-03T21:15:00+09:00",
    tags: ["イベント", "誕生日", "ディナー"] },

  // /2023/風景
  { id: "land01", path: "/2023/風景/朝霧の山.jpg", title: "朝霧の山", takenAt: "2023-03-15T05:48:00+09:00",
    tags: ["自然", "山", "朝", "風景"],
    exif: { camera: "Sony α7 IV", lens: "FE 70-200mm F2.8 GM OSS II", focalLength: "135mm", aperture: "f/8.0", shutter: "1/250s", iso: 200 } },
  { id: "land02", path: "/2023/風景/海岸線.jpg", title: "海岸線", takenAt: "2023-05-20T14:30:00+09:00",
    tags: ["自然", "海", "風景"],
    exif: { camera: "Sony α7 IV", lens: "FE 16-35mm F2.8 GM", focalLength: "16mm", aperture: "f/11", shutter: "1/500s", iso: 100 } },
  { id: "land03", path: "/2023/風景/紅葉.jpg", title: "紅葉", takenAt: "2023-11-12T11:20:00+09:00",
    tags: ["自然", "紅葉", "秋", "風景"] },
  { id: "land04", path: "/2023/風景/星空.jpg", title: "星空", takenAt: "2023-08-15T23:55:00+09:00",
    tags: ["自然", "星空", "夜景", "風景"],
    exif: { camera: "Sony α7 IV", lens: "FE 14mm F1.8 GM", focalLength: "14mm", aperture: "f/1.8", shutter: "20s", iso: 3200 } },
  { id: "land05", path: "/2023/風景/雪山.jpg", title: "雪山", takenAt: "2023-02-04T10:08:00+09:00",
    tags: ["自然", "山", "雪", "冬", "風景"] },
  { id: "land06", path: "/2023/風景/桜並木.jpg", title: "春の並木", takenAt: "2023-04-01T13:33:00+09:00",
    tags: ["自然", "桜", "春", "風景"] },

  // /未分類
  { id: "mis01", path: "/未分類/IMG_0123.jpg", title: "IMG_0123", takenAt: "2023-01-12T18:25:00+09:00",
    tags: [] },
  { id: "mis02", path: "/未分類/IMG_0456.jpg", title: "IMG_0456", takenAt: "2023-07-08T09:10:00+09:00",
    tags: [] },
  { id: "mis03", path: "/未分類/IMG_0789.jpg", title: "IMG_0789", takenAt: "2024-02-14T16:50:00+09:00",
    tags: [], uploaderId: "u_taro" },
  { id: "mis04", path: "/未分類/IMG_1024.jpg", title: "IMG_1024", takenAt: "2024-12-01T22:00:00+09:00",
    tags: [], uploaderId: "u_taro" },
]

export const MOCK_PHOTOS: Photo[] = SPECS.map((s) => ({
  id: s.id,
  uploaderId: s.uploaderId ?? "u_me",
  url: `https://picsum.photos/seed/${s.id}/1600/1067`,
  thumbnailUrl: `https://picsum.photos/seed/${s.id}/400/400`,
  path: s.path,
  title: s.title,
  takenAt: s.takenAt,
  width: 1600,
  height: 1067,
  exif: s.exif,
  tags: s.tags,
}))
