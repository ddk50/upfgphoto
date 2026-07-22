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
          photos = current_user.photos.kept.includes(:user, :tags).with_attached_image
                               .where(folder_path: path).order(taken_at: :desc)
          render json: { path: path, photos: photos.map { |p| photo_json(p) } }
        else
          groups = current_user.photos.kept.group(:folder_path).count
          # フォルダごとの最新写真 (カバー) は窓関数で一括取得する。
          # フォルダごとに order().first すると 2F+2 クエリ (F=フォルダ数) の N+1 になる
          ranked = current_user.photos.kept.select(
            "id, ROW_NUMBER() OVER (PARTITION BY folder_path " \
            "ORDER BY taken_at DESC, id DESC) AS rn"
          )
          latest_ids = Photo.from(ranked, :ranked).where("ranked.rn = 1").pluck(:id)
          latest_by_path = Photo.with_attached_image.where(id: latest_ids).index_by(&:folder_path)
          entries = groups.map do |path, count|
            latest = latest_by_path.fetch(path)
            { path: path, name: FolderPath.name(path), photo_count: count,
              cover_url: cover_url(latest), latest_taken_at: latest.taken_at }
          end
          render json: {
            total: current_user.photos.kept.count,
            folders: entries.sort_by { |e| e[:latest_taken_at] }.reverse
          }
        end
      end
    end
  end
end
