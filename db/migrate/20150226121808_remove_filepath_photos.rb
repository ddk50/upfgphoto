class RemoveFilepathPhotos < ActiveRecord::Migration[7.0]
  def up
    remove_column :photos, :filepath
  end

  def down
    add_column :photos, :filepath, :string
  end
end
