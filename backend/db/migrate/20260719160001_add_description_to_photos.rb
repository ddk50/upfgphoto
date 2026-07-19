class AddDescriptionToPhotos < ActiveRecord::Migration[8.1]
  def change
    add_column :photos, :description, :text
  end
end
