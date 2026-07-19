require "rails_helper"

RSpec.describe "admin 承認・紐付けフロー (ADR-020)" do
  let!(:admin) { User.create!(name: "管理者", nickname: "adm", role: "admin", status: "approved") }
  let!(:legacy) do
    # 一度も Google ログインしていない Twitter-only ユーザ（旧システムからの移行者）
    u = User.create!(name: "旧メンバー", nickname: "old", role: "user", status: "approved")
    u.identities.create!(provider: "twitter2", uid: "tw-999")
    u
  end
  let!(:legacy_photo) do
    Photo.create!(user: legacy, folder_path: "/2023/風景", file_name: "1.jpg",
                  title: "1.jpg", taken_at: Time.current)
  end
  let!(:pending) do
    u = User.create!(name: "新規太郎", nickname: "shinki", role: "user", status: "pending",
                     email: "shinki@example.com")
    u.identities.create!(provider: "google_oauth2", uid: "sub-shinki", email: "shinki@example.com")
    u
  end

  def login_as(user)
    post_session_for(user)
  end

  def post_session_for(user)
    allow_any_instance_of(ApplicationController)
      .to receive(:current_user).and_return(user)
  end

  describe "GET /api/v1/admin/pending_users" do
    it "承認待ちと紐付け候補 (Twitter-only ユーザ) を返す" do
      login_as(admin)
      get "/api/v1/admin/pending_users"

      body = response.parsed_body
      expect(body["pending_users"].map { |u| u["id"] }).to eq([ pending.id ])
      expect(body["pending_users"].first["google_email"]).to eq("shinki@example.com")
      # google 未連携の approved ユーザは admin 自身を含め全員が候補
      # （管理者自身が最初の移行者になるため）
      expect(body["link_candidates"].map { |u| u["id"] }).to contain_exactly(legacy.id, admin.id)
    end

    it "admin 以外は 403" do
      login_as(legacy)
      get "/api/v1/admin/pending_users"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST link (既存ユーザへ紐付け)" do
    it "google identity が移り、pending user は消え、旧資産はそのまま引ける" do
      login_as(admin)
      post "/api/v1/admin/pending_users/#{pending.id}/link",
           params: { target_user_id: legacy.id }

      expect(response).to have_http_status(:ok)
      expect(User.exists?(pending.id)).to be false

      # Google sub でも旧 Twitter UID でも同じユーザに解決する
      expect(User.find_by_identity(provider: "google_oauth2", uid: "sub-shinki")).to eq(legacy)
      expect(User.find_by_identity(provider: "twitter2", uid: "tw-999")).to eq(legacy)
      # 資産は user.id 紐づけなので無傷
      expect(legacy.reload.photos).to contain_exactly(legacy_photo)
      # email ヒントの引き継ぎ
      expect(legacy.email).to eq("shinki@example.com")
    end

    it "既に Google 連携済みのユーザには紐付けられない" do
      legacy.identities.create!(provider: "google_oauth2", uid: "sub-already")
      login_as(admin)
      post "/api/v1/admin/pending_users/#{pending.id}/link",
           params: { target_user_id: legacy.id }
      expect(response).to have_http_status(:unprocessable_content)
      expect(User.exists?(pending.id)).to be true
    end
  end

  describe "POST approve (新規ユーザとして承認)" do
    it "status が approved になる" do
      login_as(admin)
      post "/api/v1/admin/pending_users/#{pending.id}/approve"
      expect(pending.reload).to be_approved
    end
  end

  describe "DELETE (却下)" do
    it "pending user と identity が消える" do
      login_as(admin)
      expect { delete "/api/v1/admin/pending_users/#{pending.id}" }
        .to change(User, :count).by(-1).and change(Identity, :count).by(-1)
    end
  end
end
