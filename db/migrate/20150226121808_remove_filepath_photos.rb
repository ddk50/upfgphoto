class RemoveFilepathPhotos < ActiveRecord::Migration
  def up
    remove_column :photos, :filepath
  end

  def down
    add_column :photos, :filepath, :string
  end
end
