class Tagging < ApplicationRecord
  belongs_to :photo
  belongs_to :tag

  validates :tag_id, uniqueness: { scope: :photo_id }
end
