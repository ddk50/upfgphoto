# 公開設定の変更を一元処理する (frontend Context の setAccessRule/clearDescendantRules に対応)。
# - ADR-019: AccessPolicy.can_edit_access? による隷属ガード
# - ADR-018: guest 遷移で共有台帳 (share_links) に発行/停止を自動記録
# - ADR-013: clear_descendants 指定時のみ子孫の独立ルールを削除（自動上書きはしない）
class AccessRuleUpdater
  class Forbidden < StandardError; end
  class InvalidMode < StandardError; end
  # ArgumentError 継承でコントローラの既存 rescue (422 + message) に乗る
  class InvalidTarget < ArgumentError; end

  MODES = %w[inherit everyone restricted guest].freeze

  def self.apply!(folder_path:, mode:, actor:, member_ids: [], clear_descendants: false)
    # ルートは常に everyone (全ルールの継承の起点)。admin でも変更不可
    raise InvalidTarget, "ルートの公開設定は変更できません" if folder_path == "/"
    raise InvalidMode, mode unless MODES.include?(mode)
    raise Forbidden unless AccessPolicy.can_edit_access?(folder_path, actor)

    ActiveRecord::Base.transaction do
      clear_descendant_rules!(folder_path, actor) if clear_descendants

      rule = AccessRule.find_by(folder_path: folder_path)
      was_guest = rule&.guest_mode?

      if mode == "inherit"
        rule&.destroy!
        revoke_links!(folder_path, actor, "manual") if was_guest
        next nil
      end

      rule ||= AccessRule.new(folder_path: folder_path)
      rule.mode = mode
      rule.save!

      if mode == "restricted"
        sync_members!(rule, member_ids, actor)
      else
        rule.access_rule_members.destroy_all
      end

      if mode == "guest" && !was_guest
        ShareLink.create!(
          token: ShareLink.generate_token, folder_path: folder_path,
          issued_by: actor, issued_at: Time.current
        )
      elsif mode != "guest" && was_guest
        revoke_links!(folder_path, actor, "manual")
      end
      rule
    end
  end

  def self.descendant_rules(folder_path)
    prefix = folder_path == "/" ? "/" : "#{folder_path}/"
    AccessRule.where("folder_path LIKE ?", "#{sanitize_like(prefix)}%")
              .where.not(folder_path: folder_path)
              .order(:folder_path)
  end

  def self.clear_descendant_rules!(folder_path, actor)
    descendant_rules(folder_path).find_each do |rule|
      revoke_links!(rule.folder_path, actor, "parent-override") if rule.guest_mode?
      rule.destroy!
    end
  end

  def self.revoke_links!(folder_path, actor, reason)
    ShareLink.active.where(folder_path: folder_path).find_each do |link|
      link.update!(revoked_at: Time.current, revoked_by: actor, revoked_reason: reason)
    end
  end

  def self.sync_members!(rule, member_ids, actor)
    # ADR-007: オーナーは自分を許可リストから外せない（セルフロックアウト防止）
    owner_id = FolderOwner.find_by(folder_path: rule.folder_path)&.user_id
    ids = (Array(member_ids).map(&:to_i) + [ owner_id, actor.id ].compact).uniq & User.ids
    rule.access_rule_members.where.not(user_id: ids).destroy_all
    existing = rule.access_rule_members.pluck(:user_id)
    (ids - existing).each { |uid| rule.access_rule_members.create!(user_id: uid) }
  end

  def self.sanitize_like(str)
    str.gsub(/[\\%_]/) { |c| "\\#{c}" }
  end
end
