module Api
  module V1
    class AccessRulesController < BaseController
      before_action :require_approved

      # 実効ルール + 自ルール + 子孫の独立ルール (上書き警告用, ADR-013)
      def show
        path = FolderPath.normalize(params.require(:path))
        resolver = EffectiveAccessResolver.new
        effective = resolver.resolve(path)
        own = AccessRule.find_by(folder_path: path)
        blocker = AccessPolicy.edit_blocker(path, current_user)

        parent = path == "/" ? nil : File.dirname(path).then { |d| d == "" ? "/" : d }
        parent_effective = parent && resolver.resolve(parent)

        render json: {
          path: path,
          effective: {
            mode: effective&.mode || "everyone",
            source: effective&.folder_path || "/",
            member_ids: effective&.restricted_mode? ? effective.access_rule_members.map(&:user_id) : []
          },
          parent_effective: parent && {
            mode: parent_effective&.mode || "everyone",
            source: parent_effective&.folder_path || "/",
            member_ids: parent_effective&.restricted_mode? ? parent_effective.access_rule_members.map(&:user_id) : []
          },
          own_mode: own&.mode || "inherit",
          own_member_ids: own&.restricted_mode? ? own.access_rule_members.map(&:user_id) : [],
          descendant_rules: AccessRuleUpdater.descendant_rules(path)
                                            .map { |r| { path: r.folder_path, mode: r.mode } },
          can_edit: AccessPolicy.can_edit_access?(path, current_user),
          edit_blocker: blocker && {
            folder_path: blocker[:folder_path], owner_name: blocker[:owner]&.name
          }
        }
      end

      # mode=inherit でルール削除。guest 遷移は台帳に自動記録 (ADR-018)
      def update
        path = FolderPath.normalize(params.require(:path))
        AccessRuleUpdater.apply!(
          folder_path: path,
          mode: params.require(:mode),
          actor: current_user,
          member_ids: Array(params[:member_ids]),
          clear_descendants: ActiveModel::Type::Boolean.new.cast(params[:clear_descendants])
        )
        share_token = ShareLink.active.find_by(folder_path: path)&.token
        render json: { path: path, mode: params[:mode], share_token: share_token }
      rescue AccessRuleUpdater::Forbidden
        head :forbidden
      rescue AccessRuleUpdater::InvalidMode, ArgumentError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end
    end
  end
end
