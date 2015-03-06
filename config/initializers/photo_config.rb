PHOTO_CONFIG = YAML.load(
  File.read("#{Rails.root}/config/photo_config.yml"))[Rails.env]

FileUtils.mkdir_p(PHOTO_CONFIG['spool_dir']) unless FileTest.exist?(PHOTO_CONFIG['spool_dir'])
FileUtils.mkdir_p(PHOTO_CONFIG['avatar_dir']) unless FileTest.exist?(PHOTO_CONFIG['avatar_dir'])
FileUtils.mkdir_p(PHOTO_CONFIG['download_tmp_path']) unless FileTest.exist?(PHOTO_CONFIG['download_tmp_path'])

