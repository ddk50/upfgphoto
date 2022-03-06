class CreateBoard2photos < ActiveRecord::Migration[7.0]
  def change
    create_table :board2photos do |t|
      t.integer :photo_id, null: false
      t.integer :board_id, null: false
      t.timestamps
    end
    add_index :board2photos, :board_id
    add_index :board2photos, :photo_id, :unique => true
  end
end
