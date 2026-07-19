require "rails_helper"

RSpec.describe "ゲスト API (ADR-008/009/010)" do
  let!(:a) { User.create!(name: "A", nickname: "a", role: "user", status: "approved") }
  let!(:link) do
    ShareLink.create!(token: ShareLink.generate_token, folder_path: "/共有ルート",
                      issued_by: a, issued_at: Time.current)
  end

  before do
    FolderOwner.create!(folder_path: "/共有ルート", user: a)
    AccessRule.create!(folder_path: "/共有ルート", mode: "guest")
    Photo.create!(user: a, folder_path: "/共有ルート", file_name: "1.jpg", title: "r",
                  taken_at: Time.current)
    Photo.create!(user: a, folder_path: "/共有ルート/サブ", file_name: "2.jpg", title: "s",
                  taken_at: Time.current)
  end

  it "認証なしでルートとサブフォルダを閲覧できる（uploader 情報は出さない）" do
    get "/api/v1/g/#{link.token}"
    body = response.parsed_body
    expect(body["photos"].map { |p| p["title"] }).to eq([ "r" ])
    expect(body["photos"].first).not_to have_key("uploader")
    expect(body["folders"].map { |f| f["sub"] }).to eq([ "サブ" ])

    get "/api/v1/g/#{link.token}", params: { sub: "サブ" }
    expect(response.parsed_body["photos"].map { |p| p["title"] }).to eq([ "s" ])
  end

  it "停止済み・無効トークンは 404" do
    get "/api/v1/g/invalid-token"
    expect(response).to have_http_status(:not_found)

    link.update!(revoked_at: Time.current, revoked_by: a, revoked_reason: "manual")
    get "/api/v1/g/#{link.token}"
    expect(response).to have_http_status(:not_found)
  end

  it "パストラバーサルでルート外に出られない" do
    get "/api/v1/g/#{link.token}", params: { sub: "../秘密" }
    expect(response).to have_http_status(:not_found)
  end

  it "ゲストアップロードは guest_anonymous に帰属し、新規フォルダはルートオーナーのもの" do
    post "/api/v1/g/#{link.token}/photos",
         params: { files: [ fake_jpg("g.jpg") ], sub: "持ち寄り" }

    expect(response).to have_http_status(:created)
    photo = Photo.order(:id).last
    expect(photo.user.nickname).to eq("guest_anonymous")
    expect(photo.folder_path).to eq("/共有ルート/持ち寄り")
    expect(FolderOwner.find_by(folder_path: "/共有ルート/持ち寄り").user).to eq(a)
  end
end
