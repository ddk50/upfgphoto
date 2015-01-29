class Photo < ActiveRecord::Base
  belongs_to :employee
  has_many :tag2photos, dependent: :destroy
  has_many :tags, through: :tag2photos
end
