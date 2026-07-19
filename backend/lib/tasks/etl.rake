namespace :etl do
  desc "旧 upfgphoto から一括移行 (LEGACY_DB / LEGACY_DATA / SKIP_FILES で調整)"
  task import: :environment do
    abort "production での実行は FORCE=1 が必要" if Rails.env.production? && ENV["FORCE"] != "1"

    importer = Etl::LegacyImporter.new(
      legacy_db_path: ENV.fetch("LEGACY_DB", "/home/kazushi/repos/upfgphoto/db/production.sqlite3"),
      data_dir: ENV.fetch("LEGACY_DATA", "/home/kazushi/repos/upfgphoto/data/prod"),
      attach_files: ENV["SKIP_FILES"] != "1"
    )
    importer.run!
    importer.write_report(Rails.root.join("tmp/etl_report.txt"))
  end

  desc "画像ファイルの取り込みのみ (DB は wipe しない。中断からの再開用)"
  task attach: :environment do
    importer = Etl::LegacyImporter.new(
      legacy_db_path: ENV.fetch("LEGACY_DB", "/home/kazushi/repos/upfgphoto/db/production.sqlite3"),
      data_dir: ENV.fetch("LEGACY_DATA", "/home/kazushi/repos/upfgphoto/data/prod")
    )
    importer.attach_only!
    importer.write_report(Rails.root.join("tmp/etl_attach_report.txt"))
  end
end
