# ホワイトボックス検証用: 主要全テーブルの全レコード・全カラムをスナップショットし、
# 「意図した変更以外は一切起きていない」を機械的に突合できるようにする
module SnapshotHelpers
  SNAPSHOT_MODELS = [ Photo, FolderOwner, AccessRule, AccessRuleMember, ShareLink,
                      User, Identity, Tag, Tagging ].freeze

  def snapshot
    SNAPSHOT_MODELS.index_with { |m| m.order(:id).map(&:attributes) }
  end
end

RSpec.configure do |config|
  config.include SnapshotHelpers
end
