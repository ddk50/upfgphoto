require "rails_helper"

RSpec.describe "GET /api/v1/folders (ADR-003: 仮想フォルダ)" do
  let!(:a) { User.create!(name: "A", nickname: "a", role: "user", status: "approved") }
  let!(:b) { User.create!(name: "B", nickname: "b", role: "user", status: "approved") }
  let!(:outsider) { User.create!(name: "外", nickname: "out", role: "user", status: "approved") }
  let!(:admin) { User.create!(name: "管", nickname: "adm", role: "admin", status: "approved") }

  before do
    Photo.create!(user: a, folder_path: "/2023/風景", file_name: "1.jpg", title: "山",
                  description: "夜明けの山", taken_at: Time.current)
    Photo.create!(user: a, folder_path: "/秘密", file_name: "2.jpg", title: "内緒",
                  taken_at: Time.current)
    FolderOwner.create!(folder_path: "/秘密", user: a)
    rule = AccessRule.create!(folder_path: "/秘密", mode: "restricted")
    rule.access_rule_members.create!(user: a)
    rule.access_rule_members.create!(user: b)
  end

  it "子フォルダと直下写真、編集可否を返す" do
    login_as(a)
    get "/api/v1/folders", params: { path: "/" }

    body = response.parsed_body
    expect(body["folders"].map { |f| f["name"] }).to contain_exactly("2023", "秘密")
    expect(body["folders"].find { |f| f["name"] == "秘密" }["mode"]).to eq("restricted")

    # 階層モザイク用の孫サマリ
    child = body["folders"].find { |f| f["name"] == "2023" }
    expect(child["subfolder_count"]).to eq(1)
    expect(child["subfolders"].map { |s| s["name"] }).to eq([ "風景" ])

    get "/api/v1/folders", params: { path: "/2023/風景" }
    body = response.parsed_body
    expect(body["photos"].map { |p| p["title"] }).to eq([ "山" ])
    expect(body["photos"].first["description"]).to eq("夜明けの山") # 旧DBから移行した説明文
    expect(body["breadcrumb"]).to eq([ "/", "/2023", "/2023/風景" ])
  end

  describe "モザイク用カバーの重複回避" do
    def photo_with_image!(path, file, taken_at)
      p = Photo.create!(user: a, folder_path: path, file_name: file, title: file,
                        taken_at: taken_at)
      p.image.attach(io: StringIO.new("img-#{file}"), filename: file, content_type: "image/jpeg")
      p
    end

    it "親カードのカバーは表示中の孫カバーと別の写真を選ぶ" do
      photo_with_image!("/イベント/花火", "new.jpg", Time.current)          # 最新 = 孫のカバー
      photo_with_image!("/イベント", "direct.jpg", 1.day.ago)              # 重複回避で親はこちらに

      login_as(a)
      get "/api/v1/folders", params: { path: "/" }
      child = response.parsed_body["folders"].find { |f| f["name"] == "イベント" }

      expect(child["subfolders"].first["cover_url"]).to be_present
      expect(child["cover_url"]).to be_present
      expect(child["cover_url"]).not_to eq(child["subfolders"].first["cover_url"])
    end

    it "他に写真がなければ重複を許容する (カバー無しにはしない)" do
      photo_with_image!("/イベント/花火", "only.jpg", Time.current)

      login_as(a)
      get "/api/v1/folders", params: { path: "/" }
      child = response.parsed_body["folders"].find { |f| f["name"] == "イベント" }

      expect(child["cover_url"]).to be_present
      expect(child["cover_url"]).to eq(child["subfolders"].first["cover_url"])
    end
  end

  describe "カバー写真の選択 (一括ロード化後のセマンティクス)" do
    def photo_with_image!(path, file, taken_at, user: a)
      p = Photo.create!(user: user, folder_path: path, file_name: file, title: file,
                        taken_at: taken_at)
      p.image.attach(io: StringIO.new("img-#{file}"), filename: file, content_type: "image/jpeg")
      p
    end

    it "子フォルダのカバーは直下で最新の写真 (cover_url の photo id で検証)" do
      photo_with_image!("/旅行", "old.jpg", 2.days.ago)
      newest = photo_with_image!("/旅行", "new.jpg", 1.hour.ago)

      login_as(a)
      get "/api/v1/folders", params: { path: "/" }
      child = response.parsed_body["folders"].find { |f| f["name"] == "旅行" }

      expect(child["cover_url"]).to include("/photos/#{newest.id}/image")
    end

    it "restricted な配下の写真は非メンバーへのカバーに使われない (漏洩ガード)" do
      visible = photo_with_image!("/町", "pub.jpg", 2.days.ago)
      secret = photo_with_image!("/町/秘蔵", "sec.jpg", Time.current) # サブツリー最新だが restricted
      FolderOwner.create!(folder_path: "/町/秘蔵", user: a)
      rule = AccessRule.create!(folder_path: "/町/秘蔵", mode: "restricted")
      rule.access_rule_members.create!(user: a)

      login_as(outsider)
      get "/api/v1/folders", params: { path: "/" }
      child = response.parsed_body["folders"].find { |f| f["name"] == "町" }

      # 最新でも restricted 配下の写真はカバー・枚数・孫サマリのどこにも出ない
      expect(child["photo_count"]).to eq(1)
      expect(child["cover_url"]).to include("/photos/#{visible.id}/image")
      expect(child["subfolders"]).to be_empty

      # メンバーには秘蔵サブフォルダとそのカバーが見える
      login_as(a)
      get "/api/v1/folders", params: { path: "/" }
      child = response.parsed_body["folders"].find { |f| f["name"] == "町" }
      expect(child["photo_count"]).to eq(2)
      expect(child["subfolders"].map { |s| s["name"] }).to eq([ "秘蔵" ])
      expect(child["subfolders"].first["cover_url"]).to include("/photos/#{secret.id}/image")
    end
  end

  it "restricted はメンバー以外に存在ごと見せない（一覧から消え、直アクセスは404）(ADR-005/006)" do
    login_as(outsider)
    get "/api/v1/folders", params: { path: "/" }
    expect(response.parsed_body["folders"].map { |f| f["name"] }).to eq([ "2023" ])

    get "/api/v1/folders", params: { path: "/秘密" }
    expect(response).to have_http_status(:not_found)
  end

  it "メンバーと admin には見える (ADR-006)" do
    login_as(b)
    get "/api/v1/folders", params: { path: "/秘密" }
    expect(response).to have_http_status(:ok)

    login_as(admin)
    get "/api/v1/folders", params: { path: "/秘密" }
    expect(response).to have_http_status(:ok)
  end

  it "隷属ロック時は edit_blocker が理由を返す (ADR-019)" do
    Photo.create!(user: b, folder_path: "/秘密/サブ", file_name: "3.jpg", title: "s",
                  taken_at: Time.current)
    FolderOwner.create!(folder_path: "/秘密/サブ", user: b)

    login_as(b)
    get "/api/v1/folders", params: { path: "/秘密/サブ" }
    body = response.parsed_body
    expect(body["is_owner"]).to be true
    expect(body["can_edit_access"]).to be false
    expect(body["edit_blocker"]).to eq(
      "folder_path" => "/秘密", "owner_name" => "A"
    )
  end

  it "未ログインは 401" do
    get "/api/v1/folders", params: { path: "/" }
    expect(response).to have_http_status(:unauthorized)
  end
end

RSpec.describe "PATCH /api/v1/folders (リネーム, ADR-023)" do
  let!(:a) { User.create!(name: "A", nickname: "a", role: "user", status: "approved") }
  let!(:b) { User.create!(name: "B", nickname: "b", role: "user", status: "approved") }

  before do
    Photo.create!(user: a, folder_path: "/2023/風景", file_name: "1.jpg", title: "山",
                  taken_at: Time.current)
    FolderOwner.create!(folder_path: "/2023/風景", user: a)
  end

  it "オーナーはリネームでき、新パスが返る" do
    login_as(a)
    patch "/api/v1/folders", params: { path: "/2023/風景", new_name: "山岳" }

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq("path" => "/2023/山岳", "name" => "山岳")
    expect(Photo.sole.folder_path).to eq("/2023/山岳")
  end

  it "深い階層の子孫も追随し、接頭辞が同じだけの兄弟は無傷 (エンドポイント経由)" do
    Photo.create!(user: a, folder_path: "/2023/風景/山/朝焼け", file_name: "3.jpg", title: "朝",
                  taken_at: Time.current)
    Photo.create!(user: a, folder_path: "/2023/風景色", file_name: "4.jpg", title: "色",
                  taken_at: Time.current)

    login_as(a)
    patch "/api/v1/folders", params: { path: "/2023/風景", new_name: "山岳" }

    expect(response).to have_http_status(:ok)
    expect(Photo.pluck(:folder_path)).to contain_exactly(
      "/2023/山岳", "/2023/山岳/山/朝焼け", "/2023/風景色"
    )
  end

  it "オーナー以外は 403、同名衝突は 409、不正名は 422" do
    login_as(b)
    patch "/api/v1/folders", params: { path: "/2023/風景", new_name: "x" }
    expect(response).to have_http_status(:forbidden)

    Photo.create!(user: a, folder_path: "/2023/夜景", file_name: "2.jpg", title: "夜",
                  taken_at: Time.current)
    login_as(a)
    patch "/api/v1/folders", params: { path: "/2023/風景", new_name: "夜景" }
    expect(response).to have_http_status(:conflict)

    patch "/api/v1/folders", params: { path: "/2023/風景", new_name: "a/b" }
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "見えないフォルダは 404 (存在も漏らさない)" do
    rule = AccessRule.create!(folder_path: "/2023/風景", mode: "restricted")
    rule.access_rule_members.create!(user: a)

    login_as(b)
    patch "/api/v1/folders", params: { path: "/2023/風景", new_name: "x" }
    expect(response).to have_http_status(:not_found)
  end
end
