# フォルダのリネーム。フォルダは仮想概念 (ADR-003) なので、実体は配下全写真
# (ゴミ箱内含む) の folder_path と folder_owners / access_rules / share_links の
# folder_path の前置換。編集権は公開設定と同一 (AccessPolicy.can_edit_access?, ADR-019)。
class FolderRenamer
  class Forbidden < StandardError; end
  class Conflict < StandardError; end
  class InvalidName < StandardError; end

  PATH_TABLES = [ Photo, FolderOwner, AccessRule, ShareLink ].freeze

  class << self
    def rename!(folder_path:, new_name:, actor:)
      path = FolderPath.normalize(folder_path)
      raise InvalidName, "root" if path == "/"

      name = new_name.to_s.strip
      raise InvalidName, name if name.empty? || name.include?("/") || name == ".."

      new_path = path.sub(%r{/[^/]+\z}, "") + "/" + name
      return path if new_path == path

      raise Forbidden unless AccessPolicy.can_edit_access?(path, actor)
      raise Conflict, new_path if folder_exists?(new_path)

      ActiveRecord::Base.transaction do
        # 空フォルダは存在しない (ADR-014) ので、写真のない行き先に残る owner/rule は
        # 孤児レコード。unique index 衝突を避けるため先に掃除する
        purge_orphans!(FolderOwner, new_path)
        purge_orphans!(AccessRule, new_path)
        PATH_TABLES.each { |model| rewrite_prefix!(model, path, new_path) }
      end
      new_path
    end

    # ゴミ箱内の写真も含めて存在判定する (photo_uploader と同一基準)。
    # 復元時にリネーム先へ合流してしまう事故を防ぐ
    def folder_exists?(path)
      Photo.where("folder_path = ? OR folder_path LIKE ?", path, "#{sanitize_like(path)}/%").exists?
    end

    private

    def rewrite_prefix!(model, old_path, new_path)
      model.where(folder_path: old_path).update_all(folder_path: new_path)
      model.where("folder_path LIKE ?", "#{sanitize_like(old_path)}/%")
           .update_all([ "folder_path = CONCAT(?, SUBSTRING(folder_path, ?))",
                         new_path, old_path.length + 1 ])
    end

    def purge_orphans!(model, path)
      model.where(folder_path: path)
           .or(model.where("folder_path LIKE ?", "#{sanitize_like(path)}/%"))
           .destroy_all
    end

    def sanitize_like(str)
      str.gsub(/[\\%_]/) { |c| "\\#{c}" }
    end
  end
end
