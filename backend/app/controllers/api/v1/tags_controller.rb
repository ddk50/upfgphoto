module Api
  module V1
    class TagsController < BaseController
      before_action :require_approved

      def index
        counts = Tagging.group(:tag_id).count
        tags = Tag.order(:name).map do |t|
          { name: t.name, count: counts[t.id] || 0 }
        end
        render json: { tags: tags.sort_by { |t| [ -t[:count], t[:name] ] } }
      end
    end
  end
end
