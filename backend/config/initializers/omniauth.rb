# 認証は Google OAuth のみ (ADR-020)。Twitter はログイン手段としては廃止済みで、
# 旧 Twitter UID は identities のデータとしてのみ残る（admin の紐付けフローで Google に移行）
Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
           ENV["GOOGLE_CLIENT_ID"],
           ENV["GOOGLE_CLIENT_SECRET"],
           scope: "email,profile"
end

OmniAuth.config.allowed_request_methods = %i[post]
