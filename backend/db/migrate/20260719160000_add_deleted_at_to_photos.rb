class AddDeletedAtToPhotos < ActiveRecord::Migration[8.1]
  def change
    add_column :photos, :deleted_at, :datetime
    add_index :photos, :deleted_at
  end
end
