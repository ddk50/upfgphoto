module RendersPhotos
  extend ActiveSupport::Concern

  private

  def photo_access_resolver
    @photo_access_resolver ||= EffectiveAccessResolver.new
  end

  def photo_json(photo)
    {
      id: photo.id,
      title: photo.title,
      description: photo.description,
      folder_path: photo.folder_path,
      file_name: photo.file_name,
      path: photo.path,
      taken_at: photo.taken_at,
      tags: photo.tags.map(&:name),
      exif: photo.exif,
      uploader: {
        id: photo.user.id, name: photo.user.name, avatar_url: photo.user.avatar_url
      },
      is_mine: current_user&.id == photo.user_id,
      can_delete: current_user.present? &&
        (current_user.admin_role? || current_user.id == photo.user_id),
      effective_mode: photo_access_resolver.effective_mode(photo.folder_path),
      urls: photo_urls(photo)
    }
  end

  # ETL 直後は画像未添付があり得る (data/prod 配置前)。その場合は null
  def photo_urls(photo)
    return nil unless photo.image.attached?

    {
      small: photo_image_path(photo, "small"),
      large: photo_image_path(photo, "large"),
      original: photo_image_path(photo, "original")
    }
  end

  def cover_url(photo)
    return nil unless photo&.image&.attached?

    photo_image_path(photo, "small")
  end

  # 認可付き配信エンドポイントの URL。既定は認証ユーザ経路。
  # ゲスト/OGP コンテキスト (Guest::FoldersController / SharePagesController) は
  # トークンスコープ URL を返すよう override する。
  def photo_image_path(photo, variant)
    image_api_v1_photo_path(photo.id, variant: variant)
  end
end
