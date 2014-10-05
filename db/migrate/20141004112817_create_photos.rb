class CreatePhotos < ActiveRecord::Migration
  def change
    create_table :photos do |t|
      t.integer  :employee_id, null: false
      t.string   :filepath
      t.datetime :shotdate

      t.timestamps
    end
    add_index :photos, [:shotdate]
  end
end
