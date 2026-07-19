import { Link } from "react-router-dom"
import type { EffectiveAccess, Photo, User } from "@/types"
import { Calendar, Camera, Folder, Globe, ImageIcon, Link2, Lock, Tag, UserCircle } from "lucide-react"
import { serializeTagsParam } from "@/lib/search"
import { usePhotoLibrary } from "@/contexts/PhotoLibraryContext"

type PhotoMetaPanelProps = {
  photo: Photo
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function PhotoMetaPanel({ photo }: PhotoMetaPanelProps) {
  const { getPhotoEffectiveAccess, getUploader, isMyPhoto } = usePhotoLibrary()
  const access = getPhotoEffectiveAccess(photo.path)
  const uploader = getUploader(photo)
  const mine = isMyPhoto(photo)

  return (
    <div className="space-y-6 text-sm">
      <section className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight text-foreground">{photo.title}</h3>
        <p className="text-xs text-muted-foreground">{photo.path}</p>
      </section>

      <section className="space-y-3">
        <MetaRow icon={Calendar} label="撮影日時" value={formatDateTime(photo.takenAt)} />
        <MetaRow icon={ImageIcon} label="サイズ" value={`${photo.width} × ${photo.height}`} />
        <MetaRow icon={Folder} label="フォルダ" value={parentLabel(photo.path)} />
        <AccessRow access={access} photoPath={photo.path} />
        <UploaderRow uploader={uploader} mine={mine} />
      </section>

      {photo.tags && photo.tags.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Tag className="size-3.5" />
            キーワード
          </div>
          <div className="flex flex-wrap gap-1.5">
            {photo.tags.map((tag) => (
              <Link
                key={tag}
                to={`/search?tags=${encodeURIComponent(serializeTagsParam([tag]))}`}
                className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-xs transition-colors hover:border-foreground/30 hover:bg-muted"
              >
                {tag}
              </Link>
            ))}
          </div>
        </section>
      )}

      {photo.exif && (
        <section className="space-y-3 border-t pt-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Camera className="size-3.5" />
            EXIF
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {photo.exif.camera && <ExifRow label="カメラ" value={photo.exif.camera} />}
            {photo.exif.lens && <ExifRow label="レンズ" value={photo.exif.lens} />}
            {photo.exif.focalLength && <ExifRow label="焦点距離" value={photo.exif.focalLength} />}
            {photo.exif.aperture && <ExifRow label="絞り" value={photo.exif.aperture} />}
            {photo.exif.shutter && <ExifRow label="シャッター" value={photo.exif.shutter} />}
            {photo.exif.iso !== undefined && <ExifRow label="ISO" value={String(photo.exif.iso)} />}
          </dl>
        </section>
      )}
    </div>
  )
}

function AccessRow({ access, photoPath }: { access: EffectiveAccess; photoPath: string }) {
  const sourceLabel = access.source === "/" ? "ルート" : access.source
  const inheritedHint =
    access.source !== parentLabelRaw(photoPath) ? `（${sourceLabel} から継承）` : ""

  let icon = Globe
  let text = "全員に公開"
  let className = ""

  if (access.mode === "restricted") {
    icon = Lock
    text = `${access.allowedUserIds.length}人のみ閲覧可`
    className = "text-amber-800"
  } else if (access.mode === "guest") {
    icon = Link2
    text = "リンクで共有中"
    className = "text-blue-700 font-medium"
  }

  return (
    <div className="flex items-start gap-3">
      {(() => {
        const Icon = icon
        return <Icon className={`mt-0.5 size-4 ${access.mode === "guest" ? "text-blue-600" : "text-muted-foreground"}`} />
      })()}
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">アクセス</div>
        <div className={`truncate ${className}`}>{text}</div>
        {inheritedHint && (
          <div className="text-xs text-muted-foreground">{inheritedHint}</div>
        )}
      </div>
    </div>
  )
}

function UploaderRow({ uploader, mine }: { uploader: User | null; mine: boolean }) {
  if (!uploader) {
    return (
      <div className="flex items-start gap-3">
        <Link2 className="mt-0.5 size-4 text-blue-600" />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">追加者</div>
          <div className="truncate text-blue-700 font-medium">ゲスト（外部）</div>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-3">
      {mine ? (
        <UserCircle className="mt-0.5 size-4 text-muted-foreground" />
      ) : (
        <img
          src={uploader.avatarUrl}
          alt={uploader.name}
          className="mt-0.5 size-4 rounded-full object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">追加者</div>
        <div className={`truncate ${mine ? "text-foreground font-medium" : ""}`}>
          {mine ? "あなた" : uploader.name}
        </div>
      </div>
    </div>
  )
}

function parentLabel(path: string): string {
  const dirs = parentLabelRaw(path)
  return dirs === "/" ? "ライブラリ直下" : dirs
}

function parentLabelRaw(path: string): string {
  const parts = path.split("/").filter(Boolean)
  const dirs = parts.slice(0, -1)
  return dirs.length === 0 ? "/" : "/" + dirs.join("/")
}

function MetaRow({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate">{value}</div>
      </div>
    </div>
  )
}

function ExifRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </>
  )
}
