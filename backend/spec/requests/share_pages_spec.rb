require "rails_helper"

RSpec.describe "GET /g/:token (共有リンクの OGP 付き HTML 配信)" do
  let!(:a) { User.create!(name: "A", nickname: "a", role: "user", status: "approved") }
  let!(:link) do
    ShareLink.create!(token: ShareLink.generate_token, folder_path: "/共有",
                      issued_by: a, issued_at: Time.current)
  end

  def photo!(path, file)
    p = Photo.create!(user: a, folder_path: path, file_name: file, title: file,
                      taken_at: Time.current)
    p.image.attach(io: StringIO.new("fakejpeg"), filename: file, content_type: "image/jpeg")
    p
  end

  before do
    photo!("/共有", "1.jpg")
    photo!("/共有/花火", "2.jpg")
  end

  it "有効なトークンでは OGP タグ (タイトル・枚数・カバー画像) を返す" do
    get "/g/#{link.token}"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include('property="og:title" content="共有"')
    expect(response.body).to include("共有フォルダ ・ 2 枚の写真")
    # OGP のカバーはトークンスコープの配信口を指す (認可付き・クローラ取得可)
    expect(response.body).to include(
      %(property="og:image" content="http://www.example.com/api/v1/g/#{link.token}/photos/)
    )
    expect(response.body).to include('name="twitter:card" content="summary_large_image"')
  end

  it "サブパスはそのフォルダの情報になる" do
    get "/g/#{link.token}/#{ERB::Util.url_encode('花火')}"

    expect(response.body).to include('property="og:title" content="花火"')
    expect(response.body).to include("共有フォルダ ・ 1 枚の写真")
  end

  it "失効・無効トークンは OGP なしで返す (エラー表示は SPA 側の責務)" do
    link.update!(revoked_at: Time.current, revoked_by: a, revoked_reason: "manual")
    get "/g/#{link.token}"
    expect(response).to have_http_status(:ok)
    expect(response.body).not_to include("og:title")

    get "/g/unknown-token"
    expect(response.body).not_to include("og:title")
  end

  it "SPA の index.html があれば </head> の直前に注入する" do
    allow_any_instance_of(SharePagesController).to receive(:spa_index_html)
      .and_return("<html><head><title>SPA</title></head><body>app</body></html>")

    get "/g/#{link.token}"
    expect(response.body).to match(%r{og:title.*</head><body>app</body>}m)
    expect(response.body).to include("<title>SPA</title>")
  end
end
