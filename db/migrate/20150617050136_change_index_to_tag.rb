class ChangeIndexToTag < ActiveRecord::Migration
  def change
    remove_index :tag2photos, [:photo_id, :tag_id]
    add_index :tag2photos, :photo_id
    add_index :tag2photos, :tag_id
  end
end
