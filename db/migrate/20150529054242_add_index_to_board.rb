class AddIndexToBoard < ActiveRecord::Migration[7.0]
  def change
    add_index :boards, :caption, :unique => true
    remove_index :whitelists, :nickname
    add_index :whitelists, :nickname, :unique => true
  end
end
