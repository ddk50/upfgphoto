module AuthHelpers
  def login_as(user)
    allow_any_instance_of(ApplicationController)
      .to receive(:current_user).and_return(user)
  end

  # EXIF なしの偽 JPEG (PhotoUploader は EXIF 不読時に現在時刻へフォールバックする)
  def fake_jpg(name = "test.jpg")
    file = Tempfile.new([ "fake", ".jpg" ])
    file.binmode
    file.write("\xFF\xD8\xFF\xE0fakejpegdata".b)
    file.rewind
    Rack::Test::UploadedFile.new(file.path, "image/jpeg", true).tap do |u|
      u.instance_variable_set(:@original_filename, name)
    end
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
