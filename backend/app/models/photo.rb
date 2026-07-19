class Photo < ApplicationRecord
  # ゴミ箱の保持期間。経過後に trash:purge (日次cron) が完全削除する (ADR-022)
  TRASH_RETENTION = ENV.fetch("TRASH_RETENTION_DAYS", 30).to_i.days

  belongs_to :user # uploader
  has_many :taggings, dependent: :destroy
  has_many :tags, through: :taggings

  # 削除は論理削除 (ゴミ箱)。通常のクエリは kept を通すこと
  scope :kept, -> { where(deleted_at: nil) }
  scope :trashed, -> { where.not(deleted_at: nil) }

  has_one_attached :image do |attachable|
    attachable.variant :small, resize_to_limit: [ 400, 500 ]
    attachable.variant :large, resize_to_limit: [ 1024, 1024 ]
  end

  validates :folder_path, :file_name, :title, :taken_at, presence: true
  validates :folder_path, format: { with: %r{\A/}, message: "must start with /" }

  def path
    folder_path == "/" ? "/#{file_name}" : "#{folder_path}/#{file_name}"
  end

  def trashed?
    deleted_at.present?
  end

  def trash!
    update!(deleted_at: Time.current)
  end

  def restore!
    update!(deleted_at: nil)
  end

  def purge_deadline
    deleted_at && deleted_at + TRASH_RETENTION
  end
end
