module Api
  module V1
    class ShareLinksController < BaseController
      before_action :require_approved

      # admin: 全件 (共有中 + 履歴) / user: 自分がオーナーのフォルダ分 (ADR-018)
      def index
        links = ShareLink.includes(:issued_by, :revoked_by).order(issued_at: :desc)
        unless current_user.admin_role?
          own_paths = FolderOwner.where(user: current_user).pluck(:folder_path)
          links = links.where(folder_path: own_paths)
        end

        own_paths = FolderOwner.where(user: current_user).pluck(:folder_path).to_set
        owner_names = FolderOwner.includes(:user).index_by(&:folder_path)

        render json: {
          share_links: links.map do |l|
            {
              token: l.token,
              folder_path: l.folder_path,
              active: l.active?,
              own: own_paths.include?(l.folder_path),
              folder_owner: owner_names[l.folder_path]&.user&.name,
              issued_by: l.issued_by.name,
              issued_at: l.issued_at,
              revoked_at: l.revoked_at,
              revoked_by: l.revoked_by&.name,
              revoked_reason: l.revoked_reason
            }
          end
        }
      end
    end
  end
end
