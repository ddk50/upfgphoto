module RendersPhotos
  extend ActiveSupport::Concern

  private

  def photo_json(photo)
    {
      id: photo.id,
      title: photo.title,
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
      urls: photo_urls(photo)
    }
  end

  # ETL 直後は画像未添付があり得る (data/prod 配置前)。その場合は null
  def photo_urls(photo)
    return nil unless photo.image.attached?

    {
      small: rails_representation_path(photo.image.variant(:small), only_path: true),
      large: rails_representation_path(photo.image.variant(:large), only_path: true),
      original: rails_blob_path(photo.image, disposition: "inline", only_path: true)
    }
  end

  def cover_url(photo)
    return nil unless photo&.image&.attached?

    rails_representation_path(photo.image.variant(:small), only_path: true)
  end
end
