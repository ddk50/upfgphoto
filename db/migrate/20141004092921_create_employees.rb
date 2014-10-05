class CreateEmployees < ActiveRecord::Migration
  def change
    create_table :employees do |t|
      t.string :nickname
      t.string :provider
      t.string :nickname
      t.string :image_url
      t.string :uid,        null: false

      t.timestamps
    end
    add_index :employees, [:provider, :uid], unique: true
  end
end
