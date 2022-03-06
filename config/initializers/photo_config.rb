PHOTO_CONFIG = {}

case Rails.env
when "development" then
  PHOTO_CONFIG['spool_dir']           = "#{Rails.root}/data/dev/photo"
  PHOTO_CONFIG['avatar_dir']          = "#{Rails.root}/data/dev/avatar"
  PHOTO_CONFIG['thumbnail_large_dir'] = "#{Rails.root}/data/dev/thumbnail_large"
  PHOTO_CONFIG['thumbnail_small_dir'] = "#{Rails.root}/data/dev/thumbnail_small"
when "production" then
  PHOTO_CONFIG['spool_dir']           = "#{Rails.root}/data/prod/photo"
  PHOTO_CONFIG['avatar_dir']          = "#{Rails.root}/data/prod/avatar"
  PHOTO_CONFIG['thumbnail_large_dir'] = "#{Rails.root}/data/prod/thumbnail_large"
  PHOTO_CONFIG['thumbnail_small_dir'] = "#{Rails.root}/data/prod/thumbnail_small"
when "test" then
  PHOTO_CONFIG['spool_dir']           = "#{Rails.root}/data/test/photo"
  PHOTO_CONFIG['avatar_dir']          = "#{Rails.root}/data/test/avatar"
  PHOTO_CONFIG['thumbnail_large_dir'] = "#{Rails.root}/data/test/thumbnail_large"
  PHOTO_CONFIG['thumbnail_small_dir'] = "#{Rails.root}/data/test/thumbnail_small"
else
  raise StandardError.new("Could not recognize environment parameter: #{Rails.env}")
end

PHOTO_CONFIG['download_tmp_path'] = "/tmp/files"
PHOTO_CONFIG['page_window_size'] = 50

FileUtils.mkdir_p(PHOTO_CONFIG['spool_dir']) unless FileTest.exist?(PHOTO_CONFIG['spool_dir'])
FileUtils.mkdir_p(PHOTO_CONFIG['avatar_dir']) unless FileTest.exist?(PHOTO_CONFIG['avatar_dir'])
FileUtils.mkdir_p(PHOTO_CONFIG['download_tmp_path']) unless FileTest.exist?(PHOTO_CONFIG['download_tmp_path'])
FileUtils.mkdir_p(PHOTO_CONFIG['thumbnail_large_dir']) unless FileTest.exist?(PHOTO_CONFIG['thumbnail_large_dir'])
FileUtils.mkdir_p(PHOTO_CONFIG['thumbnail_small_dir']) unless FileTest.exist?(PHOTO_CONFIG['thumbnail_small_dir'])
