module Api
  module V1
    module Admin
      class PendingUsersController < BaseController
        before_action :require_admin
        before_action :set_pending_user, except: :index

        # 承認待ち一覧 + 紐付け候補（google identity を持たない既存ユーザ = Twitter-only）
        def index
          pending = User.pending.includes(:identities).map { |u| pending_json(u) }
          candidates = User.approved
                           .where.missing(:google_identity)
                           .order(:nickname)
                           .map { |u| { id: u.id, name: u.name, nickname: u.nickname } }
          render json: { pending_users: pending, link_candidates: candidates }
        end

        # 新規ユーザとして承認
        def approve
          @pending_user.update!(status: "approved")
          render json: pending_json(@pending_user)
        end

        # 既存 Twitter-only ユーザへ紐付け（旧アカウントの資産をそのまま引き継ぐ, ADR-020）
        def link
          target = User.find(params.require(:target_user_id))
          IdentityLinker.link!(pending_user: @pending_user, target_user: target)
          render json: { id: target.id, name: target.name, nickname: target.nickname }
        rescue IdentityLinker::Error => e
          render json: { error: e.message }, status: :unprocessable_entity
        end

        # 却下
        def destroy
          @pending_user.destroy!
          head :no_content
        end

        private

        def set_pending_user
          @pending_user = User.pending.find(params[:id])
        end

        def pending_json(user)
          google = user.identities.find { |i| i.provider == "google_oauth2" }
          {
            id: user.id,
            name: user.name,
            nickname: user.nickname,
            email: user.email,
            google_email: google&.email,
            requested_at: user.created_at
          }
        end
      end
    end
  end
end
