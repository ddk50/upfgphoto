module Api
  module V1
    class SearchController < BaseController
      include RendersPhotos
      before_action :require_approved

      # ADR-016: フォルダ (名前マッチ) + 写真 (タイトル/タグ/ファイル名の直接マッチのみ)
      def show
        q = params[:q].to_s.strip.downcase
        tag_names = params[:tags].to_s.split(",").map(&:strip).reject(&:empty?)
        owned = params[:owned] == "me"
        fq = FolderQuery.new(current_user)

        render json: {
          folders: q.empty? ? [] : matching_folders(q, fq),
          photos: matching_photos(q, tag_names, owned, fq).map { |p| photo_json(p) }
        }
      end

      private

      def matching_folders(q, fq)
        all_paths = Photo.distinct.pluck(:folder_path)
                         .flat_map { |p| AccessPolicy.ancestor_chain(p) }
                         .uniq - [ "/" ]
        all_paths.select { |p| FolderPath.name(p).downcase.include?(q) }
                 .select { |p| fq.folder_visible?(p) }
                 .sort.first(50)
                 .map do |p|
          count = Photo.where("folder_path = ? OR folder_path LIKE ? ESCAPE '\\'",
                              p, "#{escape_like(p)}/%").count
          { name: FolderPath.name(p), path: p, photo_count: count }
        end
      end

      def matching_photos(q, tag_names, owned, fq)
        scope = Photo.includes(:user, :tags).order(taken_at: :desc)
        scope = scope.where(user: current_user) if owned

        if tag_names.any?
          tag_names.each_with_index do |name, i|
            scope = scope.where(
              id: Tagging.joins(:tag).where(tags: { name: name }).select(:photo_id)
            )
          end
        end

        unless q.empty?
          like = "%#{escape_like(q)}%"
          tagged = Tagging.joins(:tag)
                          .where("LOWER(tags.name) LIKE ? ESCAPE '\\'", like)
                          .select(:photo_id)
          scope = scope.where(
            "LOWER(title) LIKE :q ESCAPE '\\' OR LOWER(file_name) LIKE :q ESCAPE '\\' OR photos.id IN (:tagged)",
            q: like, tagged: tagged
          )
        end

        return [] if q.empty? && tag_names.empty? && !owned

        scope.limit(500).select { |p| p.user_id == current_user.id || fq.folder_visible?(p.folder_path) }
      end

      def escape_like(str)
        str.gsub(/[\\%_]/) { |c| "\\#{c}" }
      end
    end
  end
end
