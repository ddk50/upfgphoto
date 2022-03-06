class AddRankEmployees < ActiveRecord::Migration[7.0]
  def up
    add_column :employees, :rank, :integer, null: false, default: 5
    add_column :photos, :censored, :boolean, null: false, default: false
    add_column :photos, :guest, :boolean, null: false, default: false
    add_column :activities, :description, :text
    add_column :boards, :guest, :boolean, null: false, default: false
  end

  def down
    remove_column :employees, :rank, :integer
    remove_column :photos, :censored, :boolean
    remove_column :photos, :guest, :boolean
    remove_column :activities, :description, :text
    remove_column :boards, :guest, :boolean
  end
end
