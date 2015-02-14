class AddIndexPhotos < ActiveRecord::Migration
  def up
    add_index :photos, :employee_id
  end

  def down
    remove_index :photos, :employee_id
  end
end
