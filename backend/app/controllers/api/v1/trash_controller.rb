module Api
  module V1
    # ゴミ箱 (ADR-022)。本人の写真のみ (admin は全員分)。
    # 保持期間経過後は trash:purge (日次) が完全削除する
    class TrashController < BaseController
      include RendersPhotos
      before_action :require_approved

      def index
        photos = scoped_trash.includes(:user, :tags).order(deleted_at: :desc)
        render json: {
          retention_days: Photo::TRASH_RETENTION / 1.day,
          photos: photos.map { |p| trash_json(p) }
        }
      end

      def restore
        photo = scoped_trash.find(params[:id])
        photo.restore!
        render json: trash_json(photo)
      end

      # ゴミ箱からの即時完全削除 (実ファイルも同期消去)
      def destroy
        photo = scoped_trash.find(params[:id])
        photo.image.purge if photo.image.attached?
        photo.destroy!
        head :no_content
      end

      private

      def scoped_trash
        current_user.admin_role? ? Photo.trashed : current_user.photos.trashed
      end

      def trash_json(photo)
        photo_json(photo).merge(
          deleted_at: photo.deleted_at,
          purge_deadline: photo.purge_deadline
        )
      end
    end
  end
end
