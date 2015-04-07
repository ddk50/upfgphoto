class AddIndexToBoard < ActiveRecord::Migration
  def change
    add_index :boards, :caption, :unique => true
    add_index :whitelists, :nickname, :unique => true
  end
end
