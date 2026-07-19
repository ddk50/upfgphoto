class ShareLink < ApplicationRecord
  belongs_to :issued_by, class_name: "User"
  belongs_to :revoked_by, class_name: "User", optional: true

  TOKEN_CHARS = [ *"0".."9", *"a".."z", *"A".."Z" ].freeze
  TOKEN_LENGTH = 22 # base62^22 で総当たり困難 (ADR-008)

  validates :token, presence: true, uniqueness: true
  validates :folder_path, :issued_at, presence: true
  validates :revoked_reason, inclusion: { in: %w[manual parent-override] }, allow_nil: true

  scope :active, -> { where(revoked_at: nil) }

  def self.generate_token
    Array.new(TOKEN_LENGTH) { TOKEN_CHARS[SecureRandom.random_number(TOKEN_CHARS.size)] }.join
  end

  def active?
    revoked_at.nil?
  end
end
