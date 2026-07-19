class User < ApplicationRecord
  has_many :identities, dependent: :destroy
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
end
