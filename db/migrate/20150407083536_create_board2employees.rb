class CreateBoard2employees < ActiveRecord::Migration
  def change
    create_table :board2employees do |t|
      t.integer  :employee_id, null: false
      t.integer  :board_id, null: false
      t.integer  :transaction_id, null: false
      t.timestamps
    end
    add_index :board2employees, :employee_id
    add_index :board2employees, :board_id
    add_index :board2employees, :transaction_id
  end
end
