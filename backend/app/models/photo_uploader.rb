require "exifr/jpeg"

# アップロード処理:
# - folder_path 未指定なら EXIF 撮影日から /yyyy/mm/dd に自動振り分け (ADR-014)
# - 新規に実体化されたパスへ first-creator オーナーを記録 (ADR-019)。
#   guest アップロードは最も近い既存祖先のオーナーに帰属
class PhotoUploader
  Result = Struct.new(:photos, :folders, keyword_init: true)

  def self.upload!(files:, uploader:, folder_path: nil, tag_names: [], owner_for_new_paths: nil)
    files = Array(files)
    raise ArgumentError, "no files" if files.empty?

    tags = Array(tag_names).map(&:strip).reject(&:empty?).uniq
                           .map { |name| Tag.find_or_create_by!(name: name) }

    photos = ActiveRecord::Base.transaction do
      files.map do |file|
        shot_at = infer_shot_time(file)
        dest = folder_path.presence&.then { |p| normalize(p) } || auto_folder_path(shot_at)
        register_first_creator!(dest, owner_for_new_paths || uploader)

        photo = Photo.create!(
          user: uploader,
          folder_path: dest,
          file_name: sanitize_name(file.original_filename),
          title: file.original_filename.to_s.presence || "photo",
          taken_at: shot_at,
          exif: nil
        )
        photo.image.attach(io: file.to_io, filename: photo.file_name,
                           content_type: file.content_type.presence || "image/jpeg")
        tags.each { |t| photo.taggings.create!(tag: t) }
        photo
      end
    end

    Result.new(photos: photos, folders: photos.map(&:folder_path).uniq)
  end

  def self.infer_shot_time(file)
    if file.content_type.to_s.include?("jpeg") || file.original_filename.to_s.downcase.end_with?(".jpg", ".jpeg")
      exif = EXIFR::JPEG.new(file.tempfile.tap(&:rewind))
      time = exif.date_time_original || exif.date_time
      file.tempfile.rewind
      return time if time
    end
    Time.current
  rescue EXIFR::MalformedJPEG, StandardError
    file.tempfile.rewind
    Time.current
  end

  def self.auto_folder_path(time)
    "/" + time.strftime("%Y/%m/%d")
  end

  # dest とその祖先のうち「まだ写真が存在しないパス」にオーナーを記録する。
  # 既存パス（歴史的に実体化済み）は主張しない
  def self.register_first_creator!(dest, owner)
    AccessPolicy.ancestor_chain(dest).each do |seg|
      next if seg == "/"
      next if FolderOwner.exists?(folder_path: seg)
      next if path_materialized?(seg)

      FolderOwner.create!(folder_path: seg, user: owner)
    end
  end

  def self.path_materialized?(path)
    prefix = path.gsub(/[\\%_]/) { |c| "\\#{c}" } + "/"
    Photo.where("folder_path = ? OR folder_path LIKE ?", path, "#{prefix}%").exists?
  end

  def self.normalize(path)
    segments = path.to_s.split("/").map(&:strip).reject(&:empty?)
    raise ArgumentError, "invalid path" if segments.any? { |s| s == ".." }

    "/" + segments.join("/")
  end

  def self.sanitize_name(name)
    base = File.basename(name.to_s)
    base.presence || "photo_#{SecureRandom.hex(4)}.jpg"
  end
end
