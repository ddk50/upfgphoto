class AddCaptionDescriptionPhotos < ActiveRecord::Migration
  def up
    add_column :photos, :caption, :string
    add_column :photos, :description, :text
  end

  def down
    remove_column :photos, :caption, :string
    remove_column :photos, :description, :text
  end
end
