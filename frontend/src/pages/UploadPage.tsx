import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { ChevronDown, Cloud, FolderPlus, FolderTree, ImageUp, Info, Sparkles, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
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
import { StorageBar } from "@/components/storage/StorageBar"
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"
import { normalizeFolderPath } from "@/lib/path"
import { buildAutoFolderPath, groupByAutoFolder, inferShotDate } from "@/lib/upload"
import { cn } from "@/lib/utils"
import type { Photo } from "@/types"

export function UploadPage() {
  const { tree, storage, currentUser, addPhotos } = usePhotoLibrary()
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

  useEffect(() => {
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

  const handleUpload = () => {
    const tagsLabel = parsedTags.length > 0 ? ` ・ キーワード: ${parsedTags.join(", ")}` : ""
    const now = new Date().toISOString()
    const newPhotos: Photo[] = items.map((it) => {
      const dest = useManualPath
        ? normalizeFolderPath(folderPath) || "/"
        : buildAutoFolderPath(inferShotDate(it.file))
      const basePath = dest === "/" ? "" : dest
      return {
        id: `upload_${Math.random().toString(36).slice(2, 10)}`,
        uploaderId: currentUser.id,
        url: it.previewUrl,
        thumbnailUrl: it.previewUrl,
        path: `${basePath}/${it.file.name}`,
        title: it.file.name,
        takenAt: now,
        width: 0,
        height: 0,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      }
    })
    addPhotos(newPhotos)
    const destLabel = useManualPath
      ? (normalizeFolderPath(folderPath) === "/" ? "ライブラリ直下" : folderPath)
      : `${autoBuckets.length} 個のフォルダ`
    toast.success(`${items.length} 枚を ${destLabel} にアップロードしました`, {
      description: `（モックなのでリロードで消えます）${tagsLabel}`,
    })
    setItems([])
    setTagsInput("")
    setAdvancedOpen(false)
    setUseManualPath(false)
    if (presetPath) setSearchParams({}, { replace: true })
  }

  const canUpload = items.length > 0

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">アップロード</h1>
        <p className="text-sm text-muted-foreground">
          写真をドラッグ＆ドロップすると、撮影日のフォルダに自動振り分けされます。
        </p>
      </header>

      <StorageBar storage={storage} variant="full" />

      {presetPath && useManualPath && (
        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs text-blue-900">
          <FolderPlus className="mt-0.5 size-3.5 shrink-0" />
          <span>
            新しいフォルダ <span className="font-mono font-semibold">{normalizeFolderPath(presetPath)}</span> に保存します。
            写真をアップロードした時点でフォルダが作成されます。
          </span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <section className="space-y-4">
          <Dropzone onDrop={handleDrop} />
          <UploadPreviewList items={items} onRemove={handleRemove} />
        </section>

        <aside className="space-y-4">
          <div className="space-y-2">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-medium">
              <FolderTree className="size-4 text-muted-foreground" />
              保存先
            </h2>
            {useManualPath ? (
              <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs font-mono">
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
                {useManualPath && (
                  <FolderPicker root={tree} value={folderPath} onChange={setFolderPath} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="upload-tags" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Tag className="size-3.5" />
                  キーワード（カンマ・空白区切り）
                </Label>
                <Input
                  id="upload-tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
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
        <Button disabled={!canUpload} onClick={handleUpload}>
          <ImageUp className="size-4" />
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
        ※ モック実装では `file.lastModified` を撮影日として扱っています（実プロダクトでは EXIF 撮影日を使用）
      </p>
    </div>
  )
}
