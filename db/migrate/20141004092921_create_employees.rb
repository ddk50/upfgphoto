class CreateEmployees < ActiveRecord::Migration[7.0]
  def change
    create_table :employees do |t|
      t.string :nickname
      t.string :provider
      t.string :image_url
      t.string :uid,        null: false
      t.text :description
      t.string :name

      t.timestamps
    end
    add_index :employees, [:provider, :uid], unique: true
  end
end
