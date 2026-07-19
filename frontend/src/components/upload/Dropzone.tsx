import { useDropzone } from "react-dropzone"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

type DropzoneProps = {
  onDrop: (files: File[]) => void
}

export function Dropzone({ onDrop }: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (accepted) => onDrop(accepted),
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
        <p className="text-xs text-muted-foreground">またはクリックしてファイルを選択</p>
      </div>
    </div>
  )
}
