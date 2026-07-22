require "rails_helper"

RSpec.describe "写真 API" do
  let!(:a) { User.create!(name: "A", nickname: "a", role: "user", status: "approved") }
  let!(:b) { User.create!(name: "B", nickname: "b", role: "user", status: "approved") }
  let!(:admin) { User.create!(name: "管", nickname: "adm", role: "admin", status: "approved") }

  describe "POST /api/v1/photos" do
    it "folder_path 未指定なら撮影日(フォールバック=今日)の /yyyy/mm/dd に自動振り分け (ADR-014)" do
      login_as(a)
      post "/api/v1/photos", params: { files: [ fake_jpg("x.jpg") ] }

      expect(response).to have_http_status(:created)
      photo = Photo.last
      expect(photo.folder_path).to eq("/" + Time.current.strftime("%Y/%m/%d"))
      expect(photo.image).to be_attached
    end

    it "新規パスは first-creator としてオーナー記録される (ADR-019)" do
      login_as(a)
      post "/api/v1/photos",
           params: { files: [ fake_jpg ], folder_path: "/イベント/花火大会", tags: [ "夏" ] }

      expect(FolderOwner.find_by(folder_path: "/イベント/花火大会").user).to eq(a)
      expect(FolderOwner.find_by(folder_path: "/イベント").user).to eq(a)
      expect(Photo.last.tags.map(&:name)).to eq([ "夏" ])
    end

    describe "形式・サイズ検証 (実バイトの sniffing)" do
      def fake_file(name, bytes, declared_type)
        file = Tempfile.new([ "up", File.extname(name) ])
        file.binmode
        file.write(bytes)
        file.rewind
        Rack::Test::UploadedFile.new(file.path, declared_type, true).tap do |u|
          u.instance_variable_set(:@original_filename, name)
        end
      end

      before { login_as(a) }

      it "PNG は受理される (content_type は実バイトから決まる)" do
        png = fake_file("s.png", "\x89PNG\r\n\x1a\n".b + "0" * 32, "image/png")
        post "/api/v1/photos", params: { files: [ png ], folder_path: "/x" }

        expect(response).to have_http_status(:created)
        expect(Photo.last.image.blob.content_type).to eq("image/png")
      end

      it "拡張子と content_type を偽装しても実バイトが画像でなければ 422" do
        fake = fake_file("evil.jpg", "just a text file", "image/jpeg")
        post "/api/v1/photos", params: { files: [ fake ], folder_path: "/x" }

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["error"]).to include("対応形式は JPEG / PNG / WebP / GIF")
        expect(Photo.count).to eq(0)
      end

      it "HEIC は変換案内つきの専用メッセージで 422" do
        heic = fake_file("iphone.heic", "\x00\x00\x00\x18ftypheic\x00\x00\x00\x00mif1heic".b, "image/heic")
        post "/api/v1/photos", params: { files: [ heic ], folder_path: "/x" }

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["error"]).to include("HEIC/HEIF は未対応")
        expect(response.parsed_body["error"]).to include("自動で JPEG に変換")
      end

      it "サイズ上限を超えると 422、1枚でも不正があれば全体が保存されない" do
        allow(PhotoUploader).to receive(:max_file_size).and_return(4)
        post "/api/v1/photos", params: { files: [ fake_jpg("a.jpg"), fake_jpg("b.jpg") ], folder_path: "/x" }

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["error"]).to include("サイズ上限")
        expect(Photo.count).to eq(0)
      end
    end

    describe "タグ付きアップロード" do
      it "複数ファイル×複数タグで、全ファイルに全タグが付く" do
        login_as(a)
        post "/api/v1/photos",
             params: { files: [ fake_jpg("1.jpg"), fake_jpg("2.jpg") ],
                       folder_path: "/夏祭り", tags: [ "夏", "花火" ] }

        expect(response).to have_http_status(:created)
        expect(Photo.count).to eq(2)
        Photo.find_each do |p|
          expect(p.tags.map(&:name)).to contain_exactly("夏", "花火")
        end
        expect(response.parsed_body["photos"].map { |p| p["tags"] })
          .to all(contain_exactly("夏", "花火"))
      end

      it "既存タグは再利用され、Tag 行が重複しない" do
        existing = Tag.create!(name: "夏")

        login_as(a)
        post "/api/v1/photos",
             params: { files: [ fake_jpg ], folder_path: "/x", tags: [ "夏", "新緑" ] }

        expect(Tag.where(name: "夏").sole.id).to eq(existing.id)
        expect(Tag.pluck(:name)).to contain_exactly("夏", "新緑")
        expect(Photo.last.tags.map(&:name)).to contain_exactly("夏", "新緑")
      end

      it "前後空白は strip され、空要素・重複は除去される" do
        login_as(a)
        post "/api/v1/photos",
             params: { files: [ fake_jpg ], folder_path: "/x",
                       tags: [ " 夏 ", "夏", "", "  ", "花火" ] }

        expect(Tag.pluck(:name)).to contain_exactly("夏", "花火")
        expect(Photo.last.taggings.count).to eq(2)
      end

      it "アップロードしたタグは GET /api/v1/tags の件数に反映される (サジェストの源泉, ADR-004)" do
        login_as(a)
        post "/api/v1/photos",
             params: { files: [ fake_jpg("1.jpg"), fake_jpg("2.jpg") ],
                       folder_path: "/x", tags: [ "夏" ] }

        get "/api/v1/tags"
        expect(response.parsed_body["tags"]).to include("name" => "夏", "count" => 2)
      end
    end

    it "既存パス（他人が実体化済み）の所有権は主張しない (ADR-019)" do
      Photo.create!(user: b, folder_path: "/既存", file_name: "0.jpg", title: "0",
                    taken_at: Time.current)
      FolderOwner.create!(folder_path: "/既存", user: b)

      login_as(a)
      post "/api/v1/photos", params: { files: [ fake_jpg ], folder_path: "/既存" }
      expect(FolderOwner.find_by(folder_path: "/既存").user).to eq(b)
    end
  end

  describe "DELETE /api/v1/photos/:id" do
    let!(:photo) do
      Photo.create!(user: a, folder_path: "/x", file_name: "1.jpg", title: "1",
                    taken_at: Time.current)
    end

    it "自分の写真は削除できる (論理削除 = ゴミ箱行き, ADR-022)" do
      login_as(a)
      expect { delete "/api/v1/photos/#{photo.id}" }.not_to change(Photo, :count)
      expect(photo.reload).to be_trashed
    end

    it "他人の写真は 403、admin はゴミ箱に送れる (ADR-006)" do
      login_as(b)
      delete "/api/v1/photos/#{photo.id}"
      expect(response).to have_http_status(:forbidden)

      login_as(admin)
      delete "/api/v1/photos/#{photo.id}"
      expect(photo.reload).to be_trashed
    end
  end

  describe "GET /api/v1/my_photos (ADR-017)" do
    it "自分の写真だけがフォルダ単位で返る" do
      Photo.create!(user: a, folder_path: "/mix", file_name: "a.jpg", title: "a",
                    taken_at: Time.current)
      Photo.create!(user: b, folder_path: "/mix", file_name: "b.jpg", title: "b",
                    taken_at: Time.current)

      login_as(a)
      get "/api/v1/my_photos"
      folders = response.parsed_body["folders"]
      expect(folders.find { |f| f["path"] == "/mix" }["photo_count"]).to eq(1)

      get "/api/v1/my_photos", params: { path: "/mix" }
      expect(response.parsed_body["photos"].map { |p| p["title"] }).to eq([ "a" ])
    end

    it "フォルダ一覧のカバーは各フォルダの最新写真で、並びは最新順 (窓関数一括化のセマンティクス)" do
      attach = lambda do |photo|
        photo.image.attach(io: StringIO.new("img"), filename: photo.file_name,
                           content_type: "image/jpeg")
        photo
      end
      attach.call(Photo.create!(user: a, folder_path: "/album", file_name: "old.jpg",
                                title: "old", taken_at: 3.days.ago))
      newest = attach.call(Photo.create!(user: a, folder_path: "/album", file_name: "new.jpg",
                                         title: "new", taken_at: 1.hour.ago))
      attach.call(Photo.create!(user: a, folder_path: "/zoo", file_name: "z.jpg", title: "z",
                                taken_at: 2.days.ago))

      login_as(a)
      get "/api/v1/my_photos"
      folders = response.parsed_body["folders"]

      album = folders.find { |f| f["path"] == "/album" }
      expect(album["cover_url"]).to include("/photos/#{newest.id}/image")
      expect(album["latest_taken_at"].to_time).to be_within(1.second).of(newest.taken_at)
      expect(folders.map { |f| f["path"] }).to eq([ "/album", "/zoo" ]) # 最新順
    end
  end
end
