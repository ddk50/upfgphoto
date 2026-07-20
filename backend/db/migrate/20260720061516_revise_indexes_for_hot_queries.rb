# ホットクエリの EXPLAIN 監査に基づくインデックス見直し。
# - children 集計 (folder_path 範囲 + kept) が deleted_at 単独インデックスを選び
#   半テーブル走査していたため、(folder_path, deleted_at) 複合に置き換える。
#   FolderRenamer の前置換 UPDATE も先頭列一致でこの複合を使える
# - マイフォト/ゴミ箱の本人スコープ用に (user_id, deleted_at)。FK 要件は
#   複合の先頭列が満たすので単独インデックスは撤去
# - 複合 unique の先頭列と重複する単独インデックスを整理 (書き込みコスト削減)
class ReviseIndexesForHotQueries < ActiveRecord::Migration[8.1]
  def change
    add_index :photos, [ :folder_path, :deleted_at ]
    remove_index :photos, name: "index_photos_on_folder_path"

    add_index :photos, [ :user_id, :deleted_at ]
    remove_index :photos, name: "index_photos_on_user_id"

    remove_index :taggings, name: "index_taggings_on_photo_id"
    remove_index :access_rule_members, name: "index_access_rule_members_on_access_rule_id"
  end
end
