module Api
  module V1
    module Guest
      # ゲストアップロード (ADR-010)。uploader は guest_anonymous、
      # 新規フォルダは共有ルートのオーナーに帰属
      class PhotosController < BaseController
        def create
          link = ShareLink.active.find_by!(token: params[:token])
          sub = params[:sub].to_s.split("/").map(&:strip).reject(&:empty?)
          raise ActiveRecord::RecordNotFound if sub.any? { |s| s == ".." }

          dest = sub.empty? ? link.folder_path : "#{link.folder_path}/#{sub.join('/')}"
          root_owner = FolderOwner.find_by(folder_path: link.folder_path)&.user

          result = PhotoUploader.upload!(
            files: params.require(:files),
            uploader: User.guest_system,
            folder_path: dest,
            owner_for_new_paths: root_owner
          )
          render json: { uploaded: result.photos.size, folder: dest }, status: :created
        rescue ArgumentError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end
    end
  end
end
