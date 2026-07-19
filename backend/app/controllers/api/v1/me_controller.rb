module Api
  module V1
    class MeController < BaseController
      # SPA 起動時のブートストラップ。未ログインでも 200 で返す
      def show
        if current_user
          render json: {
            id: current_user.id,
            name: current_user.name,
            nickname: current_user.nickname,
            avatar_url: current_user.avatar_url,
            role: current_user.role,
            status: current_user.status,
            expired: current_user.expired?
          }
        else
          render json: { status: "anonymous" }
        end
      end
    end
  end
end
