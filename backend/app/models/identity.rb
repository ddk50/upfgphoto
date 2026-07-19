class Identity < ApplicationRecord
  belongs_to :user

  PROVIDERS = %w[twitter twitter2 google_oauth2].freeze

  validates :provider, presence: true, inclusion: { in: PROVIDERS }
  validates :uid, presence: true, uniqueness: { scope: :provider }
end
