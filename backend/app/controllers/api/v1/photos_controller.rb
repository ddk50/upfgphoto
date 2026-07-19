module Api
  module V1
    class PhotosController < BaseController
      include RendersPhotos
      before_action :require_approved

      def show
        photo = Photo.includes(:user, :tags).find(params[:id])
        fq = FolderQuery.new(current_user)
        return head :not_found unless photo.user_id == current_user.id ||
                                      fq.folder_visible?(photo.folder_path)

        render json: photo_json(photo)
      end

      def create
        result = PhotoUploader.upload!(
          files: params.require(:files),
          uploader: current_user,
          folder_path: params[:folder_path],
          tag_names: Array(params[:tags])
        )
        render json: {
          photos: result.photos.map { |p| photo_json(p) },
          folders: result.folders
        }, status: :created
      rescue ArgumentError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # 自分の写真 or admin のみ (ADR: uploader distinction)
      def destroy
        photo = Photo.find(params[:id])
        unless current_user.admin_role? || photo.user_id == current_user.id
          return head :forbidden
        end

        photo.destroy!
        head :no_content
      end
    end
  end
end
