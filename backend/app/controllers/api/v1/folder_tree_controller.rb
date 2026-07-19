module Api
  module V1
    # FolderPicker 用: 可視な全フォルダパスと直下枚数 (SPA 側でツリーに組み立てる)
    class FolderTreeController < BaseController
      before_action :require_approved

      def show
        fq = FolderQuery.new(current_user)
        counts = Photo.kept.group(:folder_path).count
        paths = counts.keys
                      .flat_map { |p| AccessPolicy.ancestor_chain(p) }
                      .uniq
                      .select { |p| fq.folder_visible?(p) }
                      .sort
        render json: {
          folders: paths.map { |p| { path: p, photo_count: counts[p] || 0 } }
        }
      end
    end
  end
end
