module Api
  module V1
    class BaseController < ApplicationController
      # SPA からの JSON API。session cookie 認証のため、書き込みは CSRF 検証する
      # (SameSite=Lax に加えた多層防御)。トークンは GET /api/v1/me が配布し、
      # フロントは api.ts の mutate() が全書き込みに X-CSRF-Token を自動付与する
      protect_from_forgery with: :exception

      rescue_from ActionController::InvalidAuthenticityToken do
        render json: { error: "セッションが無効です。ページを再読み込みしてください" },
               status: :unprocessable_content
      end
    end
  end
end
