class Photo < ApplicationRecord
  belongs_to :user # uploader
  has_many :taggings, dependent: :destroy
  has_many :tags, through: :taggings

  has_one_attached :image do |attachable|
    attachable.variant :small, resize_to_limit: [ 400, 500 ]
    attachable.variant :large, resize_to_limit: [ 1024, 1024 ]
  end

  validates :folder_path, :file_name, :title, :taken_at, presence: true
  validates :folder_path, format: { with: %r{\A/}, message: "must start with /" }

  def path
    folder_path == "/" ? "/#{file_name}" : "#{folder_path}/#{file_name}"
  end
end
