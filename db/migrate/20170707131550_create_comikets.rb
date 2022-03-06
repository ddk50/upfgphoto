class CreateComikets < ActiveRecord::Migration[7.0]
  def change
    create_table :comikets do |t|
      t.integer :employee_id, null: false
      t.integer :color, null: false, default: 0
      t.string :date
      t.string :chiku
      t.string :space
      t.string :shima
      t.string :circle_name
      t.string :zokusei
      t.string :item
      t.integer :tanka
      t.integer :hattyusu
      t.string :hattyusha
      t.text :bikou
      t.integer :point

      t.timestamps
    end
    add_index :comikets, [:employee_id]
  end
end
