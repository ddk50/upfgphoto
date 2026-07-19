require "rails_helper"

RSpec.describe "GET /api/v1/folders" do
  let!(:a) { User.create!(name: "A", nickname: "a", role: "user", status: "approved") }
  let!(:b) { User.create!(name: "B", nickname: "b", role: "user", status: "approved") }
  let!(:outsider) { User.create!(name: "外", nickname: "out", role: "user", status: "approved") }
  let!(:admin) { User.create!(name: "管", nickname: "adm", role: "admin", status: "approved") }

  before do
    Photo.create!(user: a, folder_path: "/2023/風景", file_name: "1.jpg", title: "山",
                  taken_at: Time.current)
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

    get "/api/v1/folders", params: { path: "/2023/風景" }
    body = response.parsed_body
    expect(body["photos"].map { |p| p["title"] }).to eq([ "山" ])
    expect(body["breadcrumb"]).to eq([ "/", "/2023", "/2023/風景" ])
  end

  it "restricted はメンバー以外に存在ごと見せない（一覧から消え、直アクセスは404）" do
    login_as(outsider)
    get "/api/v1/folders", params: { path: "/" }
    expect(response.parsed_body["folders"].map { |f| f["name"] }).to eq([ "2023" ])

    get "/api/v1/folders", params: { path: "/秘密" }
    expect(response).to have_http_status(:not_found)
  end

  it "メンバーと admin には見える" do
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
