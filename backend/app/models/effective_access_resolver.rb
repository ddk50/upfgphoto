# 実効アクセスルールの解決 (ADR-005: 親→子継承、最も近い明示ルール勝ち)。
# ルール全件をメモリに載せて解決する（ルール数はフォルダ数オーダーで小さい）
class EffectiveAccessResolver
  def initialize
    @rules = AccessRule.includes(:access_rule_members).index_by(&:folder_path)
  end

  # 最も近い明示ルールを返す。なければ nil (= ルートデフォルトの everyone)
  def resolve(folder_path)
    AccessPolicy.ancestor_chain(folder_path).reverse_each do |p|
      rule = @rules[p]
      return rule if rule
    end
    nil
  end

  def effective_mode(folder_path)
    resolve(folder_path)&.mode || "everyone"
  end

  # 実効 restricted のフォルダは members + admin のみ可視 (docs/API.md 可視性の原則)
  def visible_to?(folder_path, user)
    return true if user&.admin_role?

    rule = resolve(folder_path)
    return true if rule.nil? || !rule.restricted_mode?

    user.present? && rule.access_rule_members.any? { |m| m.user_id == user.id }
  end

  # ゲストリンク用: リンク自体が部分木への権限なので内部の可視性判定を行わない (ADR-009)
  class AllVisible
    def resolve(_folder_path) = nil
    def effective_mode(_folder_path) = "guest"
    def visible_to?(_folder_path, _user) = true
  end
end
