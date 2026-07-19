require "sqlite3"

module Etl
  # 旧 upfgphoto (production.sqlite3 + data/prod) から新スキーマへの一括移行 (ADR-020)。
  # べき等: 実行のたびに対象テーブルを空にしてから取り込む。
  class LegacyImporter
    # 旧DBの boolean は Rails 世代差で 't/f' と '1/0' が混在している（実測）
    TRUTHY = [ "t", "1", 1, true ].freeze

    UNSORTED_PATH = "/未分類".freeze

    attr_reader :report

    def initialize(legacy_db_path:, data_dir:, attach_files: true, io: $stdout)
      @db = SQLite3::Database.new(legacy_db_path, readonly: true, results_as_hash: true)
      @data_dir = data_dir
      @attach_files = attach_files
      @io = io
      @report = Hash.new { |h, k| h[k] = [] }
    end

    def run!
      started = Time.current
      ActiveRecord::Base.transaction do
        wipe!
        import_users!
        import_boards!
        import_photos!
        import_tags!
      end
      attach_files!
      note :duration, "#{(Time.current - started).round(1)}s"
      verify!
      self
    end

    def write_report(path)
      File.write(path, render_report)
      @io.puts render_report
    end

    private

    def truthy?(v) = TRUTHY.include?(v)

    def note(key, value)
      @report[key] = value
    end

    def wipe!
      [ Tagging, Tag, ShareLink, AccessRuleMember, AccessRule, FolderOwner,
        ActiveStorage::Attachment, ActiveStorage::Blob, Photo, Identity, User ].each do |klass|
        klass.delete_all
      end
    end

    # --- users -------------------------------------------------------------

    def import_users!
      whitelist = @db.execute("SELECT nickname, expires_at FROM whitelists")
                     .to_h { |w| [ w["nickname"], w["expires_at"] ] }
      matched_nicknames = []

      @db.execute("SELECT * FROM employees ORDER BY id") do |e|
        wl_expires = whitelist[e["nickname"]]
        matched_nicknames << e["nickname"] if whitelist.key?(e["nickname"])
        @report[:employees_without_whitelist] << e["nickname"] unless whitelist.key?(e["nickname"])

        user = User.new(
          id: e["id"],
          name: presence(e["name"]) || e["nickname"],
          nickname: e["nickname"],
          avatar_url: presence(e["image_url"]),
          email: presence(e["email"]),
          role: e["rank"].to_i <= 1 ? "admin" : "user",
          status: "approved",
          expires_at: presence(wl_expires),
          created_at: e["created_at"], updated_at: e["updated_at"]
        )
        user.save!
        Identity.create!(user: user, provider: e["provider"], uid: e["uid"], email: presence(e["email"]))
      end

      note :users_imported, User.count
      note :identities_imported, Identity.count
      note :whitelist_never_logged_in, whitelist.size - matched_nicknames.uniq.size
    end

    # --- boards -> folder_owners / access_rules / share_links --------------

    def import_boards!
      @path_by_board_id = {}

      @db.execute("SELECT * FROM boards ORDER BY id") do |b|
        path = normalize_path(b["caption"])
        if @path_by_board_id.value?(path)
          @report[:board_path_collisions] << "#{b['id']}: #{b['caption']} -> #{path}"
          path = "#{path} (board #{b['id']})"
        end
        @path_by_board_id[b["id"]] = path

        owner_id = b["employee_id"]
        FolderOwner.create!(folder_path: path, user_id: owner_id)

        # 全ボードに明示ルールを付与し、パスの入れ子（実データに存在）で
        # 継承により旧挙動が変わることを防ぐ
        if truthy?(b["guest"])
          rule = AccessRule.create!(folder_path: path, mode: "guest")
          ShareLink.create!(
            token: ShareLink.generate_token, folder_path: path,
            issued_by_id: owner_id, issued_at: b["created_at"]
          )
          @report[:guest_boards] << path
        elsif truthy?(b["public"])
          AccessRule.create!(folder_path: path, mode: "everyone")
        else
          rule = AccessRule.create!(folder_path: path, mode: "restricted")
          member_ids = @db.execute(
            "SELECT DISTINCT employee_id FROM board2employees WHERE board_id = ?", [ b["id"] ]
          ).map { |r| r["employee_id"] }
          member_ids = (member_ids + [ owner_id ]).uniq & User.ids
          member_ids.each { |uid| rule.access_rule_members.create!(user_id: uid) }
        end
      end

      note :folders_imported, FolderOwner.count
      note :access_rules, AccessRule.group(:mode).count
      note :share_links_issued, ShareLink.count
    end

    # --- photos ------------------------------------------------------------

    def import_photos!
      board_of = @db.execute("SELECT photo_id, board_id FROM board2photos")
                    .to_h { |r| [ r["photo_id"], r["board_id"] ] }
      user_ids = User.ids.to_set
      rows = []

      @db.execute("SELECT * FROM photos ORDER BY id") do |p|
        path = @path_by_board_id[board_of[p["id"]]]
        unless path
          path = UNSORTED_PATH
          @report[:photos_without_board] << p["id"]
        end
        unless user_ids.include?(p["employee_id"])
          @report[:photos_with_unknown_uploader] << p["id"]
          next
        end

        rows << {
          id: p["id"],
          user_id: p["employee_id"],
          folder_path: path,
          file_name: "#{p['id']}.jpg",
          title: presence(p["caption"]) || "#{p['id']}.jpg",
          taken_at: presence(p["shotdate"]) || p["created_at"],
          exif: build_exif(p),
          created_at: p["created_at"], updated_at: p["updated_at"]
        }
      end

      rows.each_slice(1000) { |slice| Photo.insert_all!(slice) }
      note :photos_imported, Photo.count
    end

    def build_exif(p)
      exif = {
        camera: presence(p["model"]),
        shutter: presence(p["exposure_time"]),
        aperture: presence(p["f_number"]),
        focalLength: p["focal_length"]&.then { |f| "#{f}mm" },
        iso: p["iso_speed_ratings"]
      }.compact
      exif.empty? ? nil : exif
    end

    # --- tags --------------------------------------------------------------

    def import_tags!
      tag_rows = @db.execute("SELECT id, name FROM tags")
      tag_rows.each { |t| Tag.create!(id: t["id"], name: t["name"]) }

      photo_ids = Photo.ids.to_set
      tag_ids = Tag.ids.to_set
      pairs = @db.execute("SELECT DISTINCT photo_id, tag_id FROM tag2photos")
                 .select { |r| photo_ids.include?(r["photo_id"]) && tag_ids.include?(r["tag_id"]) }
                 .map { |r| { photo_id: r["photo_id"], tag_id: r["tag_id"] } }
      pairs.each_slice(1000) { |slice| Tagging.insert_all!(slice) }

      note :tags_imported, Tag.count
      note :taggings_imported, Tagging.count
    end

    # --- files -------------------------------------------------------------

    def attach_files!
      photo_dir = File.join(@data_dir, "photo")
      unless @attach_files && Dir.exist?(photo_dir) && !Dir.empty?(photo_dir)
        note :files_attached, 0
        note :files_missing, Photo.count
        note :files_note, "data ディレクトリが空/未指定のため attach をスキップ (本切替時に data/prod を配置して再実行)"
        return
      end

      attached = 0
      Photo.find_each do |photo|
        src = File.join(photo_dir, "#{photo.id}.jpg")
        if File.exist?(src)
          photo.image.attach(io: File.open(src), filename: photo.file_name, content_type: "image/jpeg")
          attached += 1
        else
          @report[:missing_files] << photo.id
        end
      end
      orphans = Dir.children(photo_dir).map { |f| f[/\A(\d+)\.jpg\z/, 1] }.compact.map(&:to_i) - Photo.ids
      @report[:orphan_files] = orphans

      note :files_attached, attached
      note :files_missing, @report[:missing_files].size
    end

    # --- verification ------------------------------------------------------

    def verify!
      legacy = ->(sql) { @db.get_first_value(sql) }
      checks = {
        "photos" => [ legacy.call("SELECT COUNT(*) FROM photos"), Photo.count + @report[:photos_with_unknown_uploader].size ],
        "users(employees)" => [ legacy.call("SELECT COUNT(*) FROM employees"), User.count ],
        "folders(boards)" => [ legacy.call("SELECT COUNT(*) FROM boards"), FolderOwner.count ],
        "tags" => [ legacy.call("SELECT COUNT(*) FROM tags"), Tag.count ]
      }
      checks.each do |label, (expected, actual)|
        status = expected == actual ? "OK" : "MISMATCH"
        @report[:count_checks] << "#{label}: legacy=#{expected} new=#{actual} [#{status}]"
      end
    end

    def normalize_path(caption)
      segments = caption.to_s.split("/").map(&:strip).reject(&:empty?)
      "/" + segments.join("/")
    end

    def presence(v)
      v.respond_to?(:empty?) ? (v.empty? ? nil : v) : v
    end

    def render_report
      lines = [ "== ETL 検証レポート (#{Time.current.iso8601}) ==" ]
      @report.each do |key, value|
        if value.is_a?(Array)
          lines << "#{key}: #{value.size}件"
          value.first(10).each { |v| lines << "  - #{v}" }
          lines << "  ... (以下略)" if value.size > 10
        else
          lines << "#{key}: #{value}"
        end
      end
      lines.join("\n") + "\n"
    end
  end
end
