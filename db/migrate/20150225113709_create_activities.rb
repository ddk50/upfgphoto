class CreateActivities < ActiveRecord::Migration[7.0]
  def change
    create_table :activities do |t|
      t.integer :employee_id, null: false
      t.integer :target_employee_id
      t.integer :target_photo_id
      t.integer :action_type, null: false
      t.boolean :checked, default: false
      t.timestamps
    end
    add_index :activities, [:target_employee_id]
    add_index :activities, [:target_photo_id]
    add_index :activities, [:employee_id]
    add_index :activities, [:checked]
  end
end
