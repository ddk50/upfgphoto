import { useEffect, useMemo, useState } from "react"
import { ChartPie, Loader2, User as UserIcon } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

type Uploader = { id: number; name: string; avatarUrl: string | null; count: number }

// dataviz カテゴリカルパレット (検証済みの既定スロット順、上位7人まで)。
// コントラスト WARN 3色は凡例兼テーブル併設で対応 (relief rule)
const SLICE_COLORS = [
  "#2a78d6", // blue
  "#008300", // green
  "#e87ba4", // magenta
  "#eda100", // yellow
  "#1baf7a", // aqua
  "#eb6834", // orange
  "#4a3aa7", // violet
]
const OTHER_COLOR = "#9c9a92" // 「その他」= 脱強調グレー (カテゴリではない)
const MAX_SLICES = 7

type Slice = {
  key: string
  label: string
  count: number
  color: string
  isOther: boolean
  members?: Uploader[]
}

export function StatsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.stats>> | null>(null)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    void api
      .stats()
      .then(setData)
      .catch(() => setFailed(true))
  }, [])

  const slices = useMemo<Slice[]>(() => {
    if (!data) return []
    const top = data.uploaders.slice(0, MAX_SLICES)
    const rest = data.uploaders.slice(MAX_SLICES)
    const out: Slice[] = top.map((u, i) => ({
      key: `u${u.id}`,
      label: u.name,
      count: u.count,
      color: SLICE_COLORS[i],
      isOther: false,
    }))
    if (rest.length > 0) {
      out.push({
        key: "other",
        label: `その他 ${rest.length} 人`,
        count: rest.reduce((s, u) => s + u.count, 0),
        color: OTHER_COLOR,
        isOther: true,
        members: rest,
      })
    }
    return out
  }, [data])

  if (failed) {
    return <p className="py-24 text-center text-sm text-muted-foreground">統計の取得に失敗しました。</p>
  }
  if (!data) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  const total = data.totalPhotos
  const activeSlice = slices.find((s) => s.key === active) ?? null

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <ChartPie className="size-5 text-muted-foreground" />
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">統計</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          みんなのアップロード状況（ゴミ箱内の写真は含みません）
        </p>
      </header>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground">まだ写真がありません。</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(280px,380px)_1fr]">
          <section aria-label="アップロード枚数の内訳" className="mx-auto w-full max-w-[380px]">
            <Donut
              slices={slices}
              total={total}
              active={active}
              onActiveChange={setActive}
              centerTitle={activeSlice ? activeSlice.label : "写真の総数"}
              centerValue={activeSlice ? activeSlice.count : total}
              centerSub={
                activeSlice ? `${((activeSlice.count / total) * 100).toFixed(1)}%` : `${data.uploaders.length} 人`
              }
            />
          </section>

          {/* 凡例兼テーブル (全員分。8位以下は「その他」スライスに集約) */}
          <section aria-label="ユーザ別の枚数" className="rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2 font-medium text-right">#</th>
                  <th className="px-3 py-2 font-medium">ユーザ</th>
                  <th className="w-24 px-3 py-2 font-medium text-right">枚数</th>
                  <th className="w-20 px-3 py-2 font-medium text-right">割合</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.uploaders.map((u, i) => {
                  const sliceKey = i < MAX_SLICES ? `u${u.id}` : "other"
                  const color = i < MAX_SLICES ? SLICE_COLORS[i] : OTHER_COLOR
                  return (
                    <tr
                      key={u.id}
                      onMouseEnter={() => setActive(sliceKey)}
                      onMouseLeave={() => setActive(null)}
                      className={cn("transition-colors", active === sliceKey && "bg-muted/60")}
                    >
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground tabular-nums">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            aria-hidden
                            className="size-3 shrink-0 rounded-[4px]"
                            style={{ backgroundColor: color }}
                          />
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="size-5 shrink-0 rounded-full object-cover" />
                          ) : (
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted">
                              <UserIcon className="size-3 text-muted-foreground" />
                            </span>
                          )}
                          <span className="truncate">{u.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{u.count.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">
                        {((u.count / total) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  )
}

function Donut({
  slices,
  total,
  active,
  onActiveChange,
  centerTitle,
  centerValue,
  centerSub,
}: {
  slices: Slice[]
  total: number
  active: string | null
  onActiveChange: (key: string | null) => void
  centerTitle: string
  centerValue: number
  centerSub: string
}) {
  const size = 240
  const c = size / 2
  const rOuter = 110
  const rInner = 72

  let angle = -90
  const paths = slices.map((s) => {
    const sweep = (s.count / total) * 360
    const d = annulusPath(c, c, rOuter, rInner, angle, angle + sweep)
    angle += sweep
    return { slice: s, d }
  })

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="ユーザ別アップロード枚数の円グラフ">
        {paths.map(({ slice, d }) => (
          <path
            key={slice.key}
            d={d}
            fill={slice.color}
            // スライス間 2px のサーフェスギャップ (CVD 向け副次符号化)
            stroke="var(--color-card, #fff)"
            strokeWidth={2}
            onMouseEnter={() => onActiveChange(slice.key)}
            onMouseLeave={() => onActiveChange(null)}
            className={cn(
              "cursor-pointer transition-opacity",
              active !== null && active !== slice.key && "opacity-40",
            )}
          >
            <title>{`${slice.label}: ${slice.count.toLocaleString()} 枚 (${((slice.count / total) * 100).toFixed(1)}%)`}</title>
          </path>
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="max-w-[9rem] truncate text-xs text-muted-foreground">{centerTitle}</p>
        <p className="text-2xl font-semibold tabular-nums tracking-tight">
          {centerValue.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">{centerSub}</p>
      </div>
    </div>
  )
}

// ドーナツの1スライス (扇環) のパス。全周に近い場合は2分割して描く (arc の 360° 退化対策)
function annulusPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number,
): string {
  if (endDeg - startDeg >= 359.999) {
    const mid = startDeg + 180
    return annulusPath(cx, cy, rOuter, rInner, startDeg, mid) +
      " " + annulusPath(cx, cy, rOuter, rInner, mid, endDeg)
  }
  const p = (r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180
    return `${cx + r * Math.cos(rad)} ${cy + r * Math.sin(rad)}`
  }
  const large = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${p(rOuter, startDeg)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${p(rOuter, endDeg)}`,
    `L ${p(rInner, endDeg)}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${p(rInner, startDeg)}`,
    "Z",
  ].join(" ")
}
