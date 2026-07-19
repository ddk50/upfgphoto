# 公開設定の編集権 (ADR-019)。frontend/src/lib/access.ts の canEditAccess と同一仕様。
# 実行可能な仕様書: spec/models/access_policy_spec.rb (frontend の access.test.ts と同じケース表)
#
# ルール（他人の restricted への無条件隷属）:
# - admin: 常に可 / 未ログイン(guest): 常に不可
# - 祖先(自身含む)に他人所有の restricted が1つでもあれば不可
#   （間に everyone 等の上書きが挟まっても解除されない）
# - restricted 祖先が全て自分所有なら可（自分のゾーン内は子で上書きできる）
# - restricted 祖先がなければフォルダのオーナーのみ可
#   （オーナー未登録の中間フォルダは admin のみ）
class AccessPolicy
  class << self
    def ancestor_chain(folder_path)
      segments = folder_path.to_s.split("/").reject(&:empty?)
      [ "/" ] + segments.each_index.map { |i| "/" + segments[0..i].join("/") }
    end

    # folder_path 自身を含む祖先のうち restricted ルールが乗っているパス（根から順）
    def restricted_ancestor_sources(folder_path)
      chain = ancestor_chain(folder_path)
      rules = AccessRule.where(folder_path: chain, mode: "restricted").pluck(:folder_path)
      chain & rules
    end

    def can_edit_access?(folder_path, user)
      return false if user.nil?
      return true if user.admin_role?

      sources = restricted_ancestor_sources(folder_path)
      owners = FolderOwner.where(folder_path: sources).pluck(:folder_path, :user_id).to_h
      foreign = sources.reject { |p| owners[p] == user.id }
      return false if foreign.any?
      return true if sources.any?

      FolderOwner.find_by(folder_path: folder_path)&.user_id == user.id
    end

    # 隷属でロックされている場合、その源泉（根に最も近い他人の restricted）を返す。UI の理由表示用
    def edit_blocker(folder_path, user)
      return nil if user&.admin_role?

      sources = restricted_ancestor_sources(folder_path)
      owners = FolderOwner.where(folder_path: sources).pluck(:folder_path, :user_id).to_h
      foreign = sources.reject { |p| user && owners[p] == user.id }
      return nil if foreign.empty?

      source = foreign.first
      { folder_path: source, owner: User.find_by(id: owners[source]) }
    end
  end
end
