require "rails_helper"

RSpec.describe "Google 認証フロー" do
  before do
    OmniAuth.config.test_mode = true
  end

  after do
    OmniAuth.config.test_mode = false
    OmniAuth.config.mock_auth[:google_oauth2] = nil
  end

  def mock_google(sub:, email:, name: "テスト太郎")
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new(
      provider: "google_oauth2",
      uid: sub,
      info: { email: email, name: name, image: "https://example.com/a.jpg" }
    )
  end

  def login!
    Rails.application.env_config["omniauth.auth"] = OmniAuth.config.mock_auth[:google_oauth2]
    get "/auth/google_oauth2/callback"
  ensure
    Rails.application.env_config.delete("omniauth.auth")
  end

  describe "既知の google identity" do
    it "その user でログインし / に戻る" do
      user = User.create!(name: "花", nickname: "hana", role: "user", status: "approved")
      user.identities.create!(provider: "google_oauth2", uid: "sub-hana", email: "hana@example.com")

      mock_google(sub: "sub-hana", email: "hana@example.com")
      login!

      expect(response).to redirect_to("/")
      get "/api/v1/me"
      expect(response.parsed_body).to include("id" => user.id, "status" => "approved")
    end
  end

  describe "未知の google sub" do
    it "pending user + google identity を作成し /pending へ" do
      expect { mock_google(sub: "sub-new", email: "new@example.com"); login! }
        .to change(User, :count).by(1)

      expect(response).to redirect_to("/pending")
      created = User.find_by_identity(provider: "google_oauth2", uid: "sub-new")
      expect(created).to be_pending
      expect(created.email).to eq("new@example.com")

      get "/api/v1/me"
      expect(response.parsed_body).to include("status" => "pending")
    end

    it "同じ sub で再ログインしても pending user は増えない" do
      mock_google(sub: "sub-new", email: "new@example.com")
      login!
      expect { login! }.not_to change(User, :count)
    end
  end

  describe "期限切れユーザ" do
    it "ログインを拒否する" do
      user = User.create!(name: "期限切れ", nickname: "exp", role: "user",
                          status: "approved", expires_at: 1.day.ago)
      user.identities.create!(provider: "google_oauth2", uid: "sub-exp")

      mock_google(sub: "sub-exp", email: "exp@example.com")
      login!

      expect(response).to redirect_to("/?login=expired")
      get "/api/v1/me"
      expect(response.parsed_body).to include("status" => "anonymous")
    end
  end

  describe "ログアウト" do
    it "セッションを破棄する" do
      user = User.create!(name: "花", nickname: "hana", role: "user", status: "approved")
      user.identities.create!(provider: "google_oauth2", uid: "sub-hana")
      mock_google(sub: "sub-hana", email: "hana@example.com")
      login!

      delete "/logout"
      get "/api/v1/me"
      expect(response.parsed_body).to include("status" => "anonymous")
    end
  end

  describe "開発用ログイン (dev バックドア)" do
    it "development 以外ではルートごと存在しない (test 環境も非 development 側で 404)" do
      User.create!(name: "花", nickname: "hana", role: "admin", status: "approved")

      post "/dev/login", params: { user_id: User.last.id }
      expect(response).to have_http_status(:not_found)

      # ログイン状態にもなっていない
      get "/api/v1/me"
      expect(response.parsed_body).to include("status" => "anonymous")
    end

    it "アクション自体にも development ガードがある (ルートが誤って露出しても 404)" do
      # routes.rb の分岐が万一外れた場合の多層防御 (sessions_controller#dev_login) を直接検証
      controller = SessionsController.new
      expect(Rails.env.development?).to be false
      expect { controller.dev_login }.to raise_error(ActionController::RoutingError)
    end
  end
end
