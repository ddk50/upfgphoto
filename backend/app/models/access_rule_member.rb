class AccessRuleMember < ApplicationRecord
  belongs_to :access_rule
  belongs_to :user

  validates :user_id, uniqueness: { scope: :access_rule_id }
end
