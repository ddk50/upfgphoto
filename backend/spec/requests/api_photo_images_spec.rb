require "rails_helper"

# 写真「実体 (バイト列)」の認可。JSON 一覧で見えないものは実体も取れないこと。
# 素の ActiveStorage capability URL に代わる /photos/:id/image の可視性強制を固定する。
RSpec.describe "写真実体の配信 API (認可)" do
  # 1x1 の実在 PNG (variant 生成に vips が実デコードできる必要がある)
  PNG_1X1 = Base64.decode64(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
  ).freeze

  def photo_with_image(user:, folder_path:, deleted_at: nil, file_name: "p.jpg")
    photo = Photo.create!(user: user, folder_path: folder_path, file_name: file_name,
                          title: "t", taken_at: Time.current, deleted_at: deleted_at)
    photo.image.attach(io: StringIO.new(PNG_1X1), filename: "p.png", content_type: "image/png")
    photo
  end

  let!(:owner)   { User.create!(name: "O", nickname: "o", role: "user", status: "approved") }
  let!(:member)  { User.create!(name: "M", nickname: "m", role: "user", status: "approved") }
  let!(:outsider) { User.create!(name: "X", nickname: "x", role: "user", status: "approved") }
  let!(:admin)   { User.create!(name: "A", nickname: "adm", role: "admin", status: "approved") }

  describe "GET /api/v1/photos/:id/image (認証ユーザ)" do
    context "everyone (公開) フォルダの写真" do
      let!(:photo) { photo_with_image(user: owner, folder_path: "/pub") }

      it "承認済みユーザなら誰でも 200 で取得できる" do
        login_as(outsider)
        get "/api/v1/photos/#{photo.id}/image", params: { variant: "original" }
        expect(response).to have_http_status(:ok)
        expect(response.body).to eq(PNG_1X1)
      end

      it "未ログインは 401" do
        get "/api/v1/photos/#{photo.id}/image", params: { variant: "original" }
        expect(response).to have_http_status(:unauthorized)
      end

      it "未承認 (pending) ユーザは 403" do
        pending_user = User.create!(name: "P", nickname: "p", role: "user", status: "pending")
        login_as(pending_user)
        get "/api/v1/photos/#{photo.id}/image", params: { variant: "original" }
        expect(response).to have_http_status(:forbidden)
      end

      it "small / large は variant がストリームされる" do
        login_as(owner)
        %w[small large].each do |v|
          get "/api/v1/photos/#{photo.id}/image", params: { variant: v }
          expect(response).to have_http_status(:ok), "variant=#{v} が 200 でない"
          expect(response.body.bytesize).to be > 0
        end
      end
    end

    context "restricted フォルダの写真 (核: ログイン済みでも可否が分かれる)" do
      let!(:photo) { photo_with_image(user: owner, folder_path: "/secret") }

      before do
        FolderOwner.create!(folder_path: "/secret", user: owner)
        rule = AccessRule.create!(folder_path: "/secret", mode: "restricted")
        # オーナーは常に許可リストに含まれる (ADR-007)
        AccessRuleMember.create!(access_rule: rule, user: owner)
        AccessRuleMember.create!(access_rule: rule, user: member)
      end

      it "オーナーは 200" do
        login_as(owner)
        get "/api/v1/photos/#{photo.id}/image", params: { variant: "original" }
        expect(response).to have_http_status(:ok)
      end

      it "メンバーは 200" do
        login_as(member)
        get "/api/v1/photos/#{photo.id}/image", params: { variant: "original" }
        expect(response).to have_http_status(:ok)
      end

      it "★ログイン済みの非メンバーは 404 (実体を渡さない)" do
        login_as(outsider)
        get "/api/v1/photos/#{photo.id}/image", params: { variant: "original" }
        expect(response).to have_http_status(:not_found)
        expect(response.body).not_to eq(PNG_1X1)
      end

      it "admin は 200 (ADR-006)" do
        login_as(admin)
        get "/api/v1/photos/#{photo.id}/image", params: { variant: "original" }
        expect(response).to have_http_status(:ok)
      end
    end

    context "ゴミ箱 (論理削除) の写真" do
      let!(:photo) { photo_with_image(user: owner, folder_path: "/pub", deleted_at: Time.current) }

      it "所有者は 200" do
        login_as(owner)
        get "/api/v1/photos/#{photo.id}/image", params: { variant: "original" }
        expect(response).to have_http_status(:ok)
      end

      it "admin は 200" do
        login_as(admin)
        get "/api/v1/photos/#{photo.id}/image", params: { variant: "original" }
        expect(response).to have_http_status(:ok)
      end

      it "★他人はフォルダが公開でも 404 (削除済みは所有者/admin のみ)" do
        login_as(outsider)
        get "/api/v1/photos/#{photo.id}/image", params: { variant: "original" }
        expect(response).to have_http_status(:not_found)
      end
    end

    it "存在しない id は 404" do
      login_as(owner)
      get "/api/v1/photos/999999/image", params: { variant: "original" }
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/v1/g/:token/photos/:id/image (ゲスト・トークン)" do
    let!(:link) do
      ShareLink.create!(token: ShareLink.generate_token, folder_path: "/共有",
                        issued_by: owner, issued_at: Time.current)
    end
    let!(:root_photo) { photo_with_image(user: owner, folder_path: "/共有") }
    let!(:sub_photo)  { photo_with_image(user: owner, folder_path: "/共有/サブ") }
    let!(:outside_photo) { photo_with_image(user: owner, folder_path: "/別") }

    before { AccessRule.create!(folder_path: "/共有", mode: "guest") }

    it "共有ルート直下の写真は認証なしで 200" do
      get "/api/v1/g/#{link.token}/photos/#{root_photo.id}/image", params: { variant: "original" }
      expect(response).to have_http_status(:ok)
      expect(response.body).to eq(PNG_1X1)
    end

    it "サブフォルダの写真も 200" do
      get "/api/v1/g/#{link.token}/photos/#{sub_photo.id}/image", params: { variant: "original" }
      expect(response).to have_http_status(:ok)
    end

    it "★サブツリー外の写真は有効トークンでも 404 (ルート外に出られない)" do
      get "/api/v1/g/#{link.token}/photos/#{outside_photo.id}/image", params: { variant: "original" }
      expect(response).to have_http_status(:not_found)
    end

    it "停止済みトークンは 404" do
      link.update!(revoked_at: Time.current, revoked_by: owner, revoked_reason: "manual")
      get "/api/v1/g/#{link.token}/photos/#{root_photo.id}/image", params: { variant: "original" }
      expect(response).to have_http_status(:not_found)
    end

    it "不正トークンは 404" do
      get "/api/v1/g/invalid-token/photos/#{root_photo.id}/image", params: { variant: "original" }
      expect(response).to have_http_status(:not_found)
    end

    it "ゴミ箱の写真はトークンでも 404" do
      root_photo.update!(deleted_at: Time.current)
      get "/api/v1/g/#{link.token}/photos/#{root_photo.id}/image", params: { variant: "original" }
      expect(response).to have_http_status(:not_found)
    end
  end
end
