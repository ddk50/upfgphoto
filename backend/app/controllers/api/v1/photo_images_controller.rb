module Api
  module V1
    # 写真実体の認可付き配信 (ADR: 画像バイト列にもフォルダ可視性を強制する)。
    # 認可は JSON 一覧と同一の FolderQuery#folder_visible? を再利用し、
    # 「JSON で見えないものは実体も取れない」を保証する。
    class PhotoImagesController < BaseController
      include ServesPhotoImage
      before_action :require_approved

      def show
        photo = Photo.find_by(id: params[:id])
        # 不可視・不存在はどちらも 404 (存在を漏らさない)
        return head :not_found unless photo && viewable?(photo) && photo.image.attached?

        stream_photo_image(photo, params[:variant], public_cache: false)
      end

      private

      def viewable?(photo)
        if photo.trashed?
          # ゴミ箱の実体は所有者か admin のみ (フォルダが可視でも他人には出さない)
          current_user.admin_role? || photo.user_id == current_user.id
        else
          FolderQuery.new(current_user).folder_visible?(photo.folder_path)
        end
      end
    end
  end
end
