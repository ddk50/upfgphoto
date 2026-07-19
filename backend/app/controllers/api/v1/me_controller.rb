module Api
  module V1
    class MeController < BaseController
      # SPA 起動時のブートストラップ。未ログインでも 200 で返す。
      # csrf は POST /auth/google_oauth2 (omniauth-rails_csrf_protection) 用
      def show
        base = { csrf: form_authenticity_token }
        if current_user
          render json: base.merge(
            id: current_user.id,
            name: current_user.name,
            nickname: current_user.nickname,
            avatar_url: current_user.avatar_url,
            role: current_user.role,
            status: current_user.status,
            expired: current_user.expired?
          )
        else
          render json: base.merge(status: "anonymous")
        end
      end
    end
  end
end
