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

    it "既存パス（他人が実体化済み）の所有権は主張しない" do
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

    it "他人の写真は 403、admin はゴミ箱に送れる" do
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
  end
end
