require "rails_helper"

RSpec.describe "GET /api/v1/search (ADR-016)" do
  let!(:a) { User.create!(name: "A", nickname: "a", role: "user", status: "approved") }
  let!(:outsider) { User.create!(name: "外", nickname: "out", role: "user", status: "approved") }

  before do
    Photo.create!(user: a, folder_path: "/2023/風景", file_name: "yama.jpg", title: "山の朝",
                  taken_at: Time.current)
    photo = Photo.create!(user: a, folder_path: "/2024/日常", file_name: "cat.jpg", title: "猫",
                          taken_at: Time.current)
    photo.taggings.create!(tag: Tag.create!(name: "2023"))
    Photo.create!(user: a, folder_path: "/秘密2023", file_name: "h.jpg", title: "2023隠し",
                  taken_at: Time.current)
    rule = AccessRule.create!(folder_path: "/秘密2023", mode: "restricted")
    rule.access_rule_members.create!(user: a)
  end

  it "フォルダ名マッチと写真の直接マッチ（タイトル/タグ/ファイル名）を返す" do
    login_as(a)
    get "/api/v1/search", params: { q: "2023" }

    body = response.parsed_body
    expect(body["folders"].map { |f| f["path"] }).to include("/2023", "/秘密2023")
    # 写真: タグ「2023」の猫と、タイトルに2023を含む隠しはヒット。
    # /2023 配下というだけの「山の朝」はヒットしない (直接マッチのみ)
    expect(body["photos"].map { |p| p["title"] }).to contain_exactly("猫", "2023隠し")
  end

  it "restricted はフォルダも写真も非メンバーには出ない" do
    login_as(outsider)
    get "/api/v1/search", params: { q: "2023" }

    body = response.parsed_body
    expect(body["folders"].map { |f| f["path"] }).to include("/2023")
    expect(body["folders"].map { |f| f["path"] }).not_to include("/秘密2023")
    expect(body["photos"].map { |p| p["title"] }).to eq([ "猫" ])
  end

  it "ファイル名でもヒットする" do
    login_as(a)
    get "/api/v1/search", params: { q: "yama" }
    expect(response.parsed_body["photos"].map { |p| p["title"] }).to eq([ "山の朝" ])
  end
end
