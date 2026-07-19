class FolderOwner < ApplicationRecord
  belongs_to :user

  validates :folder_path, presence: true, uniqueness: true,
                          format: { with: %r{\A/}, message: "must start with /" }
end
