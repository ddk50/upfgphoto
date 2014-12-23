class CreateTag2photos < ActiveRecord::Migration
  def change
    create_table :tag2photos do |t|
      t.integer :photo_id, null: false
      t.integer :tag_id,   null: false
      t.timestamps
    end
    add_index :tag2photos, [:photo_id, :tag_id]
  end
end
