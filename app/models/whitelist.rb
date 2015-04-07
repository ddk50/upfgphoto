class Whitelist < ActiveRecord::Base
  enum status: { pending: 0, declined: 1, accepted: 2 }
end
