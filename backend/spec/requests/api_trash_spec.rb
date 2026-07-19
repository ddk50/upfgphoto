require "rails_helper"
require "rake"

RSpec.describe "ゴミ箱 (論理削除, ADR-022)" do
  let!(:a) { User.create!(name: "A", nickname: "a", role: "user", status: "approved") }
  let!(:b) { User.create!(name: "B", nickname: "b", role: "user", status: "approved") }
  let!(:admin) { User.create!(name: "管", nickname: "adm", role: "admin", status: "approved") }
  let!(:photo) do
    p = Photo.create!(user: a, folder_path: "/x", file_name: "1.jpg", title: "1",
                      taken_at: Time.current)
    p.image.attach(io: StringIO.new("fakejpeg"), filename: "1.jpg", content_type: "image/jpeg")
    p
  end

  describe "DELETE /api/v1/photos/:id (論理削除)" do
    it "ゴミ箱行きになり、一覧から消えるが実ファイルと DB 行は残る" do
      login_as(a)
      delete "/api/v1/photos/#{photo.id}"
      expect(response).to have_http_status(:no_content)

      expect(photo.reload).to be_trashed
      expect(photo.image).to be_attached # 実ファイル保持
      expect(ActiveStorage::Blob.count).to eq(1)

      get "/api/v1/folders", params: { path: "/x" }
      expect(response.parsed_body["photos"]).to be_empty
      get "/api/v1/my_photos"
      expect(response.parsed_body["total"]).to eq(0)
      get "/api/v1/photos/#{photo.id}"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/v1/trash" do
    before { photo.trash! }

    it "本人には自分のゴミ箱が見える" do
      login_as(a)
      get "/api/v1/trash"
      body = response.parsed_body
      expect(body["photos"].map { |p| p["id"] }).to eq([ photo.id ])
      expect(body["photos"].first["purge_deadline"]).to be_present
      expect(body["retention_days"]).to eq(30)
    end

    it "他人には見えない / admin には全員分見える" do
      login_as(b)
      get "/api/v1/trash"
      expect(response.parsed_body["photos"]).to be_empty

      login_as(admin)
      get "/api/v1/trash"
      expect(response.parsed_body["photos"].size).to eq(1)
    end
  end

  describe "POST /api/v1/trash/:id/restore" do
    it "復元するとフォルダに戻る" do
      photo.trash!
      login_as(a)
      post "/api/v1/trash/#{photo.id}/restore"
      expect(photo.reload).not_to be_trashed

      get "/api/v1/folders", params: { path: "/x" }
      expect(response.parsed_body["photos"].size).to eq(1)
    end
  end

  describe "DELETE /api/v1/trash/:id (即時完全削除)" do
    it "DB 行と実ファイルが同期で消える" do
      photo.trash!
      login_as(a)
      expect { delete "/api/v1/trash/#{photo.id}" }
        .to change(Photo, :count).by(-1)
        .and change(ActiveStorage::Blob, :count).by(-1)
    end
  end

  describe "trash:purge (日次パージ)" do
    before { Rails.application.load_tasks unless Rake::Task.task_defined?("trash:purge") }

    it "保持期間を過ぎたものだけ完全削除する (実ファイル含む)" do
      old_photo = Photo.create!(user: a, folder_path: "/x", file_name: "old.jpg", title: "old",
                                taken_at: Time.current, deleted_at: 31.days.ago)
      old_photo.image.attach(io: StringIO.new("old"), filename: "old.jpg", content_type: "image/jpeg")
      recent = Photo.create!(user: a, folder_path: "/x", file_name: "r.jpg", title: "r",
                             taken_at: Time.current, deleted_at: 1.day.ago)

      Rake::Task["trash:purge"].execute

      expect(Photo.exists?(old_photo.id)).to be false
      expect(Photo.exists?(recent.id)).to be true
      expect(ActiveStorage::Blob.where(filename: "old.jpg")).to be_empty
      expect(photo.reload.image).to be_attached # ゴミ箱外は無傷
    end

    it "期限切れゴミ箱写真 (と、そのタグ関連) 以外は全テーブル・全カラム無変更 (ホワイトボックス)" do
      tag = Tag.create!(name: "思い出")
      old_photo = Photo.create!(user: a, folder_path: "/x", file_name: "old.jpg", title: "old",
                                taken_at: Time.current, deleted_at: 31.days.ago)
      old_photo.taggings.create!(tag: tag)
      recent = Photo.create!(user: a, folder_path: "/x", file_name: "r.jpg", title: "r",
                             taken_at: Time.current, deleted_at: 1.day.ago)
      recent.taggings.create!(tag: tag)
      photo.taggings.create!(tag: tag)

      before_state = snapshot
      Rake::Task["trash:purge"].execute

      # 期待値 = 事前状態から「期限切れ写真の行」と「その taggings」だけを除いたもの。
      # kept 写真・期限内ゴミ箱・タグ本体・ユーザ等は 1 カラムも変わらない
      expected = before_state.merge(
        Photo => before_state[Photo].reject { |r| r["id"] == old_photo.id },
        Tagging => before_state[Tagging].reject { |r| r["photo_id"] == old_photo.id }
      )
      expect(snapshot).to eq(expected)
      expect(Tag.exists?(tag.id)).to be true # タグ本体は他の写真が使っているので残る
    end
  end
end
