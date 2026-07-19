module Api
  module V1
    # 全ログインユーザ向けの統計。ユーザ別アップロード枚数 (ゴミ箱除く)
    class StatsController < BaseController
      before_action :require_approved

      def show
        counts = Photo.kept.group(:user_id).count
        users = User.where(id: counts.keys).index_by(&:id)
        uploaders = counts.map do |id, count|
          u = users[id]
          { id: id, name: u&.name || "不明", avatar_url: u&.avatar_url, count: count }
        end
        render json: {
          total_photos: counts.values.sum,
          uploaders: uploaders.sort_by { |r| [ -r[:count], r[:name] ] }
        }
      end
    end
  end
end
