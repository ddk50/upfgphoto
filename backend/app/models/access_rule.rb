class AccessRule < ApplicationRecord
  has_many :access_rule_members, dependent: :destroy
  has_many :members, through: :access_rule_members, source: :user

  enum :mode, { everyone: "everyone", restricted: "restricted", guest: "guest" }, suffix: :mode

  validates :folder_path, presence: true, uniqueness: true,
                          format: { with: %r{\A/}, message: "must start with /" }
end
