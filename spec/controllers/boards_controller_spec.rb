require 'rails_helper'

RSpec.describe BoardsController, :type => :controller do
  include Upload

  describe "upload" do
    it "should parse jpg with exif" do
      newphoto = Photo.new(employee_id: 1, guest: false)

      jpg = Rails.root.to_s + "/spec/controllers/items/1.JPG"
      set_and_save_photo_exif(newphoto, jpg)

      expect(newphoto.shotdate).not_to be(nil)
      expect(newphoto.model).not_to be(nil)
      expect(newphoto.exposure_time).not_to be(nil)
      expect(newphoto.f_number).not_to be(nil)
      expect(newphoto.focal_length).not_to be(nil)
      expect(newphoto.focal_length_in_35mm_film).not_to be(nil)
      expect(newphoto.iso_speed_ratings).not_to be(nil)
      expect(newphoto.update_date_time).not_to be(nil)
    end

    it "should occur no error with a jpg that has no exif " do
      newphoto = Photo.new(employee_id: 1, guest: false)

      jpg = Rails.root.to_s + "/spec/controllers/items/noexif.JPG"
      set_and_save_photo_exif(newphoto, jpg)

      expect(newphoto.shotdate).to be(nil)
      expect(newphoto.model).to be(nil)
      expect(newphoto.exposure_time).to be(nil)
      expect(newphoto.f_number).to be(nil)
      expect(newphoto.focal_length).to be(nil)
      expect(newphoto.focal_length_in_35mm_film).to be(nil)
      expect(newphoto.iso_speed_ratings).to be(nil)
      expect(newphoto.update_date_time).to be(nil)
    end
  end
end
