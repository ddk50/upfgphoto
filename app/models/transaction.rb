class Transaction < ActiveRecord::Base
  belongs_to :from, class_name: "Employee", foreign_key: :id
  belongs_to :to, class_name: "Employee", foreign_key: :id
  has_one :board2employee

  enum status: { pending: 0, declined: 1, accepted: 2 }

  before_save do
    self.uri_hash = Digest::SHA1.hexdigest(SecureRandom.uuid.to_s + "UPFG is watching you").to_s
  end
end
