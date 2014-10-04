class CreateEmployees < ActiveRecord::Migration
  def change
    create_table :employees do |t|
      t.string :nickname
      t.string :provider
      t.string :nickname
      t.string :image_url

      t.timestamps
    end
    add_index :employees, [:provider], unique: true
  end
end
