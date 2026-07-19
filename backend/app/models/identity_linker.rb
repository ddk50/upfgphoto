# Google 初回ログインで作られた pending user の google identity を、
# 既存の Twitter-only ユーザへ付け替える (ADR-020 の「すんなり移行」の実体)。
# 旧 Twitter identity は削除せず併存し、資産の紐づけ (users.id) は一切変わらない。
class IdentityLinker
  class Error < StandardError; end

  def self.link!(pending_user:, target_user:)
    raise Error, "承認待ちユーザではありません" unless pending_user.pending?
    raise Error, "自分自身には紐付けられません" if pending_user == target_user
    if target_user.identities.exists?(provider: "google_oauth2")
      raise Error, "紐付け先は既に Google 連携済みです"
    end

    google = pending_user.identities.find_by(provider: "google_oauth2")
    raise Error, "google identity がありません" unless google

    ActiveRecord::Base.transaction do
      google.update!(user: target_user)
      target_user.update!(email: google.email) if target_user.email.blank? && google.email.present?
      pending_user.reload.destroy!
    end
    target_user
  end
end
