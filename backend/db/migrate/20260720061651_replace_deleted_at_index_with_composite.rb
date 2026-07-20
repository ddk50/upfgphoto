# deleted_at 単独を (deleted_at, folder_path) 複合に置き換える。
# 先頭列が同じため trash:purge / ゴミ箱一覧の用途は維持しつつ、
# 巨大サブツリーの children 集計 (deleted_at IS NULL + folder_path 範囲) が
# ref+範囲でこの複合に乗れるようになる (インデックス総数は不変)
class ReplaceDeletedAtIndexWithComposite < ActiveRecord::Migration[8.1]
  def change
    add_index :photos, [ :deleted_at, :folder_path ]
    remove_index :photos, name: "index_photos_on_deleted_at"
  end
end
