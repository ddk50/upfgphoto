module Api
  module V1
    module Admin
      class UsersController < BaseController
        before_action :require_admin

        def index
          users = User.approved.includes(:identities).order(:nickname).map do |u|
            {
              id: u.id,
              name: u.name,
              nickname: u.nickname,
              email: u.email,
              avatar_url: u.avatar_url,
              role: u.role,
              banned: u.banned,
              expires_at: u.expires_at,
              expired: u.expired?,
              joined_at: u.created_at,
              providers: u.identities.map(&:provider).sort,
              is_self: u.id == current_user.id
            }
          end
          render json: { users: users }
        end

        # expires_at / banned の変更 (自分自身は変更不可)
        def update
          user = User.approved.find(params[:id])
          return head :unprocessable_content if user.id == current_user.id

          attrs = {}
          attrs[:expires_at] = params[:expires_at].presence if params.key?(:expires_at)
          attrs[:banned] = ActiveModel::Type::Boolean.new.cast(params[:banned]) if params.key?(:banned)
          user.update!(attrs)
          render json: { id: user.id, banned: user.banned, expires_at: user.expires_at }
        end
      end
    end
  end
end
