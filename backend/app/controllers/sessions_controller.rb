class SessionsController < ApplicationController
  # OAuth コールバックは外部からのリダイレクトなので CSRF トークンを持たない
  skip_forgery_protection only: %i[create dev_login]

  # Google OAuth callback。
  # - 既知の identity (google sub) → その user でログイン
  # - 未知 → pending user + google identity を作成し /pending へ (ADR-011)
  #   admin が既存 Twitter-only ユーザへ紐付けるか新規承認する (ADR-020)
  def create
    auth = request.env["omniauth.auth"]
    user = User.find_by_identity(provider: auth.provider, uid: auth.uid) ||
           create_pending_user!(auth)

    if user.expired?
      reset_session
      redirect_to "/?login=expired"
      return
    end

    session[:user_id] = user.id
    redirect_to user.pending? ? "/pending" : "/"
  end

  def failure
    redirect_to "/?login=failed"
  end

  def destroy
    reset_session
    head :no_content
  end

  # 開発環境限定: Google 資格情報なしでローカル動作確認するためのバックドア
  def dev_login
    raise ActionController::RoutingError, "not found" unless Rails.env.development?

    session[:user_id] = User.find(params.require(:user_id)).id
    head :no_content
  end

  private

  def create_pending_user!(auth)
    ActiveRecord::Base.transaction do
      email = auth.info&.email
      user = User.create!(
        name: auth.info&.name.presence || email.to_s.split("@").first.presence || "unknown",
        nickname: email.to_s.split("@").first.presence || "user#{SecureRandom.hex(3)}",
        avatar_url: auth.info&.image,
        email: email,
        role: "user",
        status: "pending"
      )
      # Google の恒久識別子は OIDC の sub (auth.uid)。メールアドレスは可変なので識別子にしない
      user.identities.create!(provider: auth.provider, uid: auth.uid, email: email)
      user
    end
  end
end
