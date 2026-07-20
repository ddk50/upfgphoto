require "rails_helper"

RSpec.describe "SPA フォールバック配信 (本番配信構成)" do
  let(:spa_html) { "<html><head><title>SPA</title></head><body>app</body></html>" }

  before do
    allow_any_instance_of(SpaController).to receive(:index_html).and_return(spa_html)
  end

  it "クライアントルートへの直リンクは index.html を返す" do
    get "/folders/2023/%E9%A2%A8%E6%99%AF"
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("<title>SPA</title>")

    get "/"
    expect(response.body).to include("<title>SPA</title>")

    get "/stats"
    expect(response.body).to include("<title>SPA</title>")

    # curl・クローラの既定 (Accept: */*) でも SPA を返す
    get "/folders/test", headers: { "Accept" => "*/*" }
    expect(response.body).to include("<title>SPA</title>")
  end

  it "API パスは吸わない (未知の API は JSON 404 のまま)" do
    get "/api/v1/nonexistent"
    expect(response).to have_http_status(:not_found)
    expect(response.body).not_to include("<title>SPA</title>")
  end

  it "既存ルートが優先される (/up ヘルスチェック, /g/* の OGP 配信)" do
    get "/up"
    expect(response.body).not_to include("<title>SPA</title>")

    a = User.create!(name: "A", nickname: "a", role: "user", status: "approved")
    link = ShareLink.create!(token: ShareLink.generate_token, folder_path: "/x",
                             issued_by: a, issued_at: Time.current)
    get "/g/#{link.token}"
    # share_pages 側のフォールバック HTML (OGP ルート) であって SPA catch-all ではない
    expect(response.body).not_to include("<title>SPA</title>")
  end

  it "index.html 未配置 (dev 相当) では 404" do
    allow_any_instance_of(SpaController).to receive(:index_html).and_return(nil)
    get "/folders/x"
    expect(response).to have_http_status(:not_found)
  end
end
