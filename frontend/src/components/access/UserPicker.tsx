import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import type { User } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { isExpired } from "@/lib/access"

type UserPickerProps = {
  users: User[]
  selectedIds: string[]
  currentUserId: string
  onChange: (ids: string[]) => void
}

export function UserPicker({ users, selectedIds, currentUserId, onChange }: UserPickerProps) {
  const [filter, setFilter] = useState("")

  const filteredUsers = useMemo(() => {
    const f = filter.trim().toLowerCase()
    const active = users.filter(
      (u) => (!u.banned && !isExpired(u)) || selectedIds.includes(u.id),
    )
    if (!f) return active
    return active.filter(
      (u) =>
        u.email.toLowerCase().includes(f) || u.name.toLowerCase().includes(f),
    )
  }, [users, filter, selectedIds])

  const selectedSet = new Set(selectedIds)

  const toggle = (id: string) => {
    if (id === currentUserId) return
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
          placeholder="ユーザを検索（名前・メール）"
          className="pl-9 h-9"
        />
      </div>
      <ScrollArea className="h-64 rounded-xl border bg-card">
        <ul className="divide-y">
          {filteredUsers.map((u) => {
            const isSelected = selectedSet.has(u.id)
            const isSelf = u.id === currentUserId
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
                    checked={isSelected}
                    disabled={isSelf}
                    onCheckedChange={() => toggle(u.id)}
                  />
                  <img
                    src={u.avatarUrl}
                    alt={u.name}
                    className="size-8 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`truncate font-medium ${u.banned || isExpired(u) ? "text-muted-foreground line-through" : ""}`}>{u.name}</span>
                      {isSelf && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          自分
                        </span>
                      )}
                      {u.banned && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-800">
                          Banned
                        </span>
                      )}
                      {!u.banned && isExpired(u) && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">
                          期限切れ
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{u.email}</div>
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
