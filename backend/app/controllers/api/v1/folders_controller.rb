module Api
  module V1
    class FoldersController < BaseController
      include RendersPhotos
      before_action :require_approved

      def show
        path = FolderPath.normalize(params[:path] || "/")
        fq = FolderQuery.new(current_user)
        return head :not_found unless fq.folder_visible?(path)

        rule = fq.resolver.resolve(path)
        owner = FolderOwner.find_by(folder_path: path)&.user
        blocker = AccessPolicy.edit_blocker(path, current_user)

        render json: {
          path: path,
          name: FolderPath.name(path),
          breadcrumb: fq.breadcrumb(path),
          folders: fq.children(path).map { |c| child_json(c, fq) },
          photos: fq.direct_photos(path).map { |p| photo_json(p) },
          access: access_json(rule),
          owner: owner && { id: owner.id, name: owner.name, avatar_url: owner.avatar_url },
          is_owner: owner&.id == current_user.id,
          can_edit_access: AccessPolicy.can_edit_access?(path, current_user),
          edit_blocker: blocker && {
            folder_path: blocker[:folder_path],
            owner_name: blocker[:owner]&.name
          }
        }
      rescue ArgumentError
        head :bad_request
      end

      private

      def child_json(child, fq)
        owner = FolderOwner.find_by(folder_path: child.path)&.user
        {
          name: child.name,
          path: child.path,
          photo_count: child.photo_count,
          cover_url: cover_url(child.cover_photo),
          mode: fq.resolver.effective_mode(child.path),
          owner: owner && { id: owner.id, name: owner.name, avatar_url: owner.avatar_url },
          is_mine_owner: owner&.id == current_user.id
        }
      end

      def access_json(rule)
        mode = rule&.mode || "everyone"
        json = { mode: mode, source: rule&.folder_path || "/" }
        if rule&.restricted_mode?
          json[:member_ids] = rule.access_rule_members.map(&:user_id)
        end
        if rule&.guest_mode?
          json[:share_token] = ShareLink.active.find_by(folder_path: rule.folder_path)&.token
        end
        json
      end
    end
  end
end
