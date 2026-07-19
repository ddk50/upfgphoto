import { useDropzone, type FileRejection } from "react-dropzone"
import { toast } from "sonner"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

type DropzoneProps = {
  onDrop: (files: File[]) => void
}

// サーバ側の許可リスト (PhotoUploader::ALLOWED_TYPES) と揃えること
const ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
}

function handleRejected(rejections: FileRejection[]) {
  const names = rejections.map((r) => r.file.name)
  const hasHeic = names.some((n) => /\.hei[cf]$/i.test(n))
  toast.error(
    hasHeic
      ? "HEIC は未対応です。写真アプリから選択すると自動で JPEG に変換されます"
      : "未対応のファイル形式です（対応: JPEG / PNG / WebP / GIF）",
    { description: names.slice(0, 3).join(", ") + (names.length > 3 ? ` ほか ${names.length - 3} 件` : "") },
  )
}

export function Dropzone({ onDrop }: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT,
    onDrop: (accepted) => onDrop(accepted),
    onDropRejected: handleRejected,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-muted/40 px-6 py-12 sm:py-20 text-center transition-colors cursor-pointer",
        isDragActive
          ? "border-ring bg-muted/70"
          : "border-border hover:border-ring/60 hover:bg-muted/60",
      )}
    >
      <input {...getInputProps()} />
      <div className="flex size-12 items-center justify-center rounded-full bg-background border">
        <Upload className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {isDragActive ? "ここにドロップ" : "写真をここにドラッグ＆ドロップ"}
        </p>
        <p className="text-xs text-muted-foreground">
          またはクリックしてファイルを選択（JPEG / PNG / WebP / GIF）
        </p>
      </div>
    </div>
  )
}
