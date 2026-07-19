import { useMemo, useState } from "react"
import { Search, User as UserIcon } from "lucide-react"
import type { ApiUser } from "@/lib/api"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

type UserPickerProps = {
  users: ApiUser[]
  selectedIds: number[]
  lockedIds: number[] // 外せないユーザ (オーナー自身など, ADR-007)
  onChange: (ids: number[]) => void
}

export function UserPicker({ users, selectedIds, lockedIds, onChange }: UserPickerProps) {
  const [filter, setFilter] = useState("")

  const filteredUsers = useMemo(() => {
    const f = filter.trim().toLowerCase()
    if (!f) return users
    return users.filter(
      (u) => u.nickname.toLowerCase().includes(f) || u.name.toLowerCase().includes(f),
    )
  }, [users, filter])

  const selectedSet = new Set(selectedIds)
  const lockedSet = new Set(lockedIds)

  const toggle = (id: number) => {
    if (lockedSet.has(id)) return
    const next = new Set(selectedSet)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(Array.from(next))
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="ユーザを検索（名前・ID）"
          className="pl-9 h-9"
        />
      </div>
      <ScrollArea className="h-64 rounded-xl border bg-card">
        <ul className="divide-y">
          {filteredUsers.map((u) => {
            const isSelected = selectedSet.has(u.id)
            const isLocked = lockedSet.has(u.id)
            return (
              <li key={u.id}>
                <label
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted/60 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    toggle(u.id)
                  }}
                >
                  <Checkbox
                    checked={isSelected || isLocked}
                    disabled={isLocked}
                    onCheckedChange={() => toggle(u.id)}
                  />
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="size-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-8 items-center justify-center rounded-full bg-muted">
                      <UserIcon className="size-4 text-muted-foreground" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="truncate font-medium">{u.name}</span>
                      {isLocked && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          必須
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">@{u.nickname}</div>
                  </div>
                </label>
              </li>
            )
          })}
          {filteredUsers.length === 0 && (
            <li className="px-3 py-4 text-sm text-muted-foreground">
              該当するユーザがいません。
            </li>
          )}
        </ul>
      </ScrollArea>
    </div>
  )
}
