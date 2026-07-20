import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { ChevronDown, Cloud, FolderPlus, FolderTree, ImageUp, Info, Loader2, Sparkles, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Dropzone } from "@/components/upload/Dropzone"
import {
  UploadPreviewList,
  type PreviewItem,
} from "@/components/upload/UploadPreviewList"
import { FolderPicker } from "@/components/upload/FolderPicker"
import { TagSuggestInput } from "@/components/tags/TagSuggestInput"
import { StorageBar } from "@/components/storage/StorageBar"
import { api, ApiError } from "@/lib/api"
import { normalizeFolderPath } from "@/lib/path"
import { groupByAutoFolder } from "@/lib/upload"
import type { FolderNode, StorageInfo } from "@/types"
import { cn } from "@/lib/utils"

export function UploadPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  // フォルダ新規作成 (CreateFolderButton) からの遷移: 保存先をプリセットし手動指定モードで開く
  const presetPath = searchParams.get("to")
  const [items, setItems] = useState<PreviewItem[]>([])
  const [folderPath, setFolderPath] = useState<string>(() =>
    presetPath ? normalizeFolderPath(presetPath) : "/",
  )
  const [advancedOpen, setAdvancedOpen] = useState(() => !!presetPath)
  const [useManualPath, setUseManualPath] = useState(() => !!presetPath)
  const [tagsInput, setTagsInput] = useState("")
  const [uploading, setUploading] = useState(false)
  const [storage, setStorage] = useState<StorageInfo | null>(null)
  const [tree, setTree] = useState<FolderNode | null>(null)

  useEffect(() => {
    void api.storage().then(setStorage).catch(() => setStorage(null))
    void api.folderTree().then(setTree).catch(() => setTree(null))
    return () => {
      items.forEach((it) => URL.revokeObjectURL(it.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDrop = (files: File[]) => {
    const next: PreviewItem[] = files.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setItems((prev) => [...prev, ...next])
  }

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  const parsedTags = tagsInput
    .split(/[,、\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const autoBuckets = useMemo(
    () => groupByAutoFolder(items.map((it) => it.file)),
    [items],
  )

  const handleUpload = async () => {
    setUploading(true)
    try {
      const result = await api.uploadPhotos({
        files: items.map((it) => it.file),
        folderPath: useManualPath ? normalizeFolderPath(folderPath) : undefined,
        tags: parsedTags,
      })
      const destLabel =
        result.folders.length === 1 ? result.folders[0] : `${result.folders.length} 個のフォルダ`
      toast.success(`${result.photos.length} 枚を ${destLabel} にアップロードしました`)
      items.forEach((it) => URL.revokeObjectURL(it.previewUrl))
      setItems([])
      setTagsInput("")
      setAdvancedOpen(false)
      setUseManualPath(false)
      if (presetPath) {
        setSearchParams({}, { replace: true })
        navigate(`/folders${result.folders[0] ?? ""}`)
      }
    } catch (e) {
      toast.error(
        e instanceof ApiError && e.serverMessage ? e.serverMessage : "アップロードに失敗しました",
      )
    } finally {
      setUploading(false)
    }
  }

  // ルート直下への保存は WebUI では許可しない (整理上の方針。API 自体は許容)
  const manualPathIsRoot = useManualPath && normalizeFolderPath(folderPath) === "/"
  const canUpload = items.length > 0 && !uploading && !manualPathIsRoot

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">アップロード</h1>
        <p className="text-sm text-muted-foreground">
          写真をドラッグ＆ドロップすると、撮影日のフォルダに自動振り分けされます。
        </p>
      </header>

      {storage && <StorageBar storage={storage} variant="full" />}

      {presetPath && useManualPath && !manualPathIsRoot && (
        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs text-blue-900">
          <FolderPlus className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {/* プリセット (?to=) ではなく現在の選択を表示する。ピッカーで選び直したらそれが実際の保存先 */}
            フォルダ <span className="break-all font-mono font-semibold">{normalizeFolderPath(folderPath)}</span> に保存します。
            まだ存在しないフォルダの場合は、写真をアップロードした時点で作成されます。
          </span>
        </div>
      )}

      {/* grid 子の min-width:auto による横はみ出しを min-w-0 で封じる (モバイル) */}
      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <section className="min-w-0 space-y-4">
          <Dropzone onDrop={handleDrop} />
          <UploadPreviewList items={items} onRemove={handleRemove} />
        </section>

        <aside className="min-w-0 space-y-4">
          <div className="space-y-2">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-medium">
              <FolderTree className="size-4 text-muted-foreground" />
              保存先
            </h2>
            {useManualPath ? (
              <div className="break-all rounded-xl bg-muted/40 px-3 py-2 font-mono text-xs">
                {folderPath || "/"}
              </div>
            ) : (
              <AutoDestinationPreview buckets={autoBuckets} />
            )}
          </div>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border bg-card px-3 py-2 text-sm hover:bg-muted/40"
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="size-4 text-muted-foreground" />
                  詳細設定 <span className="text-xs text-muted-foreground">（任意）</span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform",
                    advancedOpen && "rotate-180",
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-3">
              <div className="space-y-2 rounded-xl border bg-card p-3">
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useManualPath}
                    onChange={(e) => setUseManualPath(e.target.checked)}
                    className="mt-0.5 size-4 accent-primary"
                  />
                  <span className="space-y-0.5">
                    <span className="block font-medium">保存先を手動で指定する</span>
                    <span className="block text-xs text-muted-foreground">
                      全ての写真を 1 つのフォルダにまとめます
                    </span>
                  </span>
                </label>
                {useManualPath && tree && (
                  <FolderPicker root={tree} value={folderPath} onChange={setFolderPath} />
                )}
                {manualPathIsRoot && (
                  <p className="text-xs text-amber-700">
                    ルート直下には保存できません。フォルダを選択するか、新規パスを入力してください。
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="upload-tags" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Tag className="size-3.5" />
                  キーワード（カンマ・空白区切り）
                </Label>
                <TagSuggestInput
                  id="upload-tags"
                  value={tagsInput}
                  onChange={setTagsInput}
                  placeholder="京都, 桜, 旅行"
                />
                {parsedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {parsedTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </aside>
      </div>

      <Separator />

      <div className="flex items-center justify-end gap-3">
        <p className="mr-auto text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <Cloud className="size-3.5" />
          {items.length} 枚を選択中
        </p>
        <Button
          variant="outline"
          disabled={!canUpload}
          onClick={() => {
            items.forEach((it) => URL.revokeObjectURL(it.previewUrl))
            setItems([])
          }}
        >
          クリア
        </Button>
        <Button disabled={!canUpload} onClick={() => void handleUpload()}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
          アップロード
        </Button>
      </div>
    </div>
  )
}

function AutoDestinationPreview({ buckets }: { buckets: ReturnType<typeof groupByAutoFolder> }) {
  if (buckets.length === 0) {
    return (
      <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        写真を選ぶと自動振り分けが表示されます
      </div>
    )
  }
  return (
    <div className="space-y-2 rounded-xl bg-muted/40 px-3 py-2">
      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3.5" />
        撮影日ごとに {buckets.length} 個のフォルダに自動振り分け
      </p>
      <ul className="space-y-0.5 text-xs">
        {buckets.map((b) => (
          <li key={b.folderPath} className="flex items-center justify-between gap-2">
            <span className="truncate font-mono">{b.folderPath}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">{b.files.length}枚</span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-muted-foreground">
        ※ プレビューはファイルの更新日時による目安です。実際の振り分けはサーバ側で EXIF 撮影日から決まります
      </p>
    </div>
  )
}
