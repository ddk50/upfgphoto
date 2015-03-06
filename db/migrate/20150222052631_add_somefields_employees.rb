class AddSomefieldsEmployees < ActiveRecord::Migration
  def up
    add_column :employees, :branch, :string
    add_column :employees, :position, :string
    add_column :employees, :hiredate, :datetime
    add_column :employees, :birthdate, :datetime
    add_column :employees, :address, :string
    add_column :employees, :phone, :string
    add_column :employees, :email, :string
    add_column :employees, :existavatar, :boolean, default: false
    add_column :employees, :edited, :boolean, default: false
  end

  def down
    remove_column :employees, :branch, :string
    remove_column :employees, :position, :string
    remove_column :employees, :hiredate, :datetime
    remove_column :employees, :birthdate, :datetime
    remove_column :employees, :address, :string
    remove_column :employees, :phone, :string
    remove_column :employees, :email, :string
    remove_column :employees, :existavatar, :boolean
    remove_column :employees, :edited, :boolean
  end

end
