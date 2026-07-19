module Api
  module V1
    # UserPicker 用の最小情報 (approved のみ)
    class UsersController < BaseController
      before_action :require_approved

      def index
        users = User.approved.order(:nickname).map do |u|
          { id: u.id, name: u.name, nickname: u.nickname, avatar_url: u.avatar_url }
        end
        render json: { users: users }
      end
    end
  end
end
