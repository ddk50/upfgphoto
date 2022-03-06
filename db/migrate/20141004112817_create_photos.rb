class CreatePhotos < ActiveRecord::Migration[7.0]
  def change
    create_table :photos do |t|
      t.integer  :employee_id, null: false
      t.string   :filepath
      t.datetime :shotdate
      t.string   :model
      t.string   :exposure_time
      t.string   :f_number
      t.integer  :focal_length
      t.integer  :focal_length_in_35mm_film
      t.integer  :iso_speed_ratings
      t.datetime :update_date_time

      t.timestamps
    end
    add_index :photos, [:shotdate]
  end
end
