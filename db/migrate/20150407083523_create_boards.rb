class CreateBoards < ActiveRecord::Migration
  def change
    create_table :boards do |t|
      t.integer  :employee_id, null: false
      t.string   :caption, null: false
      t.text     :description
      t.boolean  :specialized, null: false, default: false
      t.boolean  :public, null: false, default: false
      t.timestamps
    end
    add_index :boards, :employee_id
  end
end
