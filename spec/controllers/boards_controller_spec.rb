require 'rails_helper'

RSpec.describe BoardsController, :type => :controller do
  include Upload

  describe "upload" do
    it "should parse jpg info" do
      newphoto = Photo.new(employee_id: 1, guest: false)

      jpg = Rails.root.to_s + "/spec/controllers/items/1.JPG"
      set_and_save_photo_exif(newphoto, jpg)
    end
  end
end
