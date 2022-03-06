class AddIndexPhotos < ActiveRecord::Migration[7.0]
  def up
    add_index :photos, :employee_id
  end

  def down
    remove_index :photos, :employee_id
  end
end
