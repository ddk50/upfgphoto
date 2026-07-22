require "rails_helper"

RSpec.describe "PUT /api/v1/access_rules (台帳連動, ADR-013/018/019)" do
  let!(:a) { User.create!(name: "A", nickname: "a", role: "user", status: "approved") }
  let!(:b) { User.create!(name: "B", nickname: "b", role: "user", status: "approved") }
  let!(:admin) { User.create!(name: "管", nickname: "adm", role: "admin", status: "approved") }

  before do
    Photo.create!(user: a, folder_path: "/album", file_name: "1.jpg", title: "1",
                  taken_at: Time.current)
    FolderOwner.create!(folder_path: "/album", user: a)
  end

  it "ルート (/) は admin でも 422 で拒否される" do
    login_as(admin)
    put "/api/v1/access_rules", params: { path: "/", mode: "guest" }

    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body["error"]).to include("ルートの公開設定は変更できません")
    expect(AccessRule.find_by(folder_path: "/")).to be_nil
    expect(ShareLink.count).to eq(0)
  end

  it "guest 化で share_link が発行され、解除で manual 停止が台帳に残る (ADR-008/018)" do
    login_as(a)
    put "/api/v1/access_rules", params: { path: "/album", mode: "guest" }
    expect(response).to have_http_status(:ok)
    token = response.parsed_body["share_token"]
    expect(token).to match(/\A[0-9a-zA-Z]{22}\z/)

    put "/api/v1/access_rules", params: { path: "/album", mode: "inherit" }
    link = ShareLink.find_by(token: token)
    expect(link.active?).to be false
    expect(link.revoked_reason).to eq("manual")
    expect(link.revoked_by).to eq(a)
    expect(ShareLink.count).to eq(1) # 台帳から消えない
  end

  it "clear_descendants で子孫の guest 共有は parent-override として停止される (ADR-013)" do
    Photo.create!(user: a, folder_path: "/album/sub", file_name: "2.jpg", title: "2",
                  taken_at: Time.current)
    FolderOwner.create!(folder_path: "/album/sub", user: a)
    login_as(a)
    put "/api/v1/access_rules", params: { path: "/album/sub", mode: "guest" }
    sub_token = response.parsed_body["share_token"]

    put "/api/v1/access_rules",
        params: { path: "/album", mode: "restricted", member_ids: [ a.id ], clear_descendants: true }

    expect(AccessRule.find_by(folder_path: "/album/sub")).to be_nil
    expect(ShareLink.find_by(token: sub_token).revoked_reason).to eq("parent-override")
  end

  it "他人の restricted 配下では非オーナーの変更を 403 で拒否する (ADR-019 隷属)" do
    login_as(a)
    put "/api/v1/access_rules", params: { path: "/album", mode: "restricted", member_ids: [ a.id, b.id ] }

    Photo.create!(user: b, folder_path: "/album/b-folder", file_name: "3.jpg", title: "3",
                  taken_at: Time.current)
    FolderOwner.create!(folder_path: "/album/b-folder", user: b)

    login_as(b)
    put "/api/v1/access_rules", params: { path: "/album/b-folder", mode: "guest" }
    expect(response).to have_http_status(:forbidden)
    expect(ShareLink.count).to eq(0)

    login_as(admin)
    put "/api/v1/access_rules", params: { path: "/album/b-folder", mode: "guest" }
    expect(response).to have_http_status(:ok)
  end

  it "間に everyone の上書きが挟まっても隷属は解除されない (ADR-019 無条件隷属の肝)" do
    # /album (A の restricted) → /album/open (A が everyone で上書き) → /album/open/b-deep (B 所有)
    login_as(a)
    put "/api/v1/access_rules", params: { path: "/album", mode: "restricted", member_ids: [ a.id, b.id ] }
    Photo.create!(user: a, folder_path: "/album/open", file_name: "4.jpg", title: "4",
                  taken_at: Time.current)
    FolderOwner.create!(folder_path: "/album/open", user: a)
    put "/api/v1/access_rules", params: { path: "/album/open", mode: "everyone" }
    expect(response).to have_http_status(:ok)

    Photo.create!(user: b, folder_path: "/album/open/b-deep", file_name: "5.jpg", title: "5",
                  taken_at: Time.current)
    FolderOwner.create!(folder_path: "/album/open/b-deep", user: b)

    # B は自分のフォルダでも、A の restricted が根側にある限り everyone 越しでも 403
    login_as(b)
    put "/api/v1/access_rules", params: { path: "/album/open/b-deep", mode: "guest" }
    expect(response).to have_http_status(:forbidden)
    expect(ShareLink.count).to eq(0)

    # ゾーンの主 A は同じ場所を編集できる
    login_as(a)
    put "/api/v1/access_rules", params: { path: "/album/open/b-deep", mode: "guest" }
    expect(response).to have_http_status(:ok)
  end

  it "restricted のオーナーは許可リストから外れない (ADR-007)" do
    login_as(a)
    put "/api/v1/access_rules", params: { path: "/album", mode: "restricted", member_ids: [ b.id ] }
    member_ids = AccessRule.find_by(folder_path: "/album").access_rule_members.pluck(:user_id)
    expect(member_ids).to include(a.id, b.id)
  end
end
