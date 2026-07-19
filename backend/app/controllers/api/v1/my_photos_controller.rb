module Api
  module V1
    # ADR-017: マイフォトはフォルダ単位のフラット一覧。自分の写真のみで構成され、
    # 他人の写真は構造的に混入しない
    class MyPhotosController < BaseController
      include RendersPhotos
      before_action :require_approved

      def index
        if params[:path].present?
          path = FolderPath.normalize(params[:path])
          photos = current_user.photos.includes(:user, :tags)
                               .where(folder_path: path).order(taken_at: :desc)
          render json: { path: path, photos: photos.map { |p| photo_json(p) } }
        else
          groups = current_user.photos.group(:folder_path).count
          entries = groups.map do |path, count|
            latest = current_user.photos.where(folder_path: path).order(taken_at: :desc).first
            { path: path, name: FolderPath.name(path), photo_count: count,
              cover_url: cover_url(latest), latest_taken_at: latest.taken_at }
          end
          render json: {
            total: current_user.photos.count,
            folders: entries.sort_by { |e| e[:latest_taken_at] }.reverse
          }
        end
      end
    end
  end
end
