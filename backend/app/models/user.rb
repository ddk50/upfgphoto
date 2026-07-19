class User < ApplicationRecord
  has_many :identities, dependent: :destroy
  has_one :google_identity, -> { where(provider: "google_oauth2") },
          class_name: "Identity", inverse_of: :user, dependent: nil
  has_many :photos, dependent: :restrict_with_error

  enum :role, { admin: "admin", user: "user" }, suffix: :role
  enum :status, { approved: "approved", pending: "pending" }

  validates :name, :nickname, presence: true

  # Twitter UID / Google sub どちらからでも解決する (ADR-020)
  def self.find_by_identity(provider:, uid:)
    joins(:identities).find_by(identities: { provider: provider, uid: uid })
  end

  def expired?(now = Time.current)
    expires_at.present? && expires_at < now
  end

  def login_blocked?(now = Time.current)
    banned? || expired?(now)
  end

  # ゲストアップロードの帰属先 (ADR-010)。identity を持たないためログインは不可能
  def self.guest_system
    find_or_create_by!(nickname: "guest_anonymous") do |u|
      u.name = "ゲスト（外部）"
      u.role = "user"
      u.status = "approved"
    end
  end
end
