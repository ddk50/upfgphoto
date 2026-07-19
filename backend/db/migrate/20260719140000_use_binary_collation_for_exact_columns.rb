# MySQL の utf8mb4 デフォルト照合 (accent/case-insensitive) では
# 「大小違いのタグ」(実データに nikonF5/NikonF5) が unique 衝突し、
# 共有トークンの照合も大文字小文字を無視してしまう。
# 完全一致すべき列を binary 照合にして SQLite/旧システムの意味論に揃える (ADR-021)。
class UseBinaryCollationForExactColumns < ActiveRecord::Migration[8.1]
  def change
    return unless mysql?

    change_column :tags, :name, :string, null: false, collation: "utf8mb4_bin"
    change_column :share_links, :token, :string, null: false, collation: "utf8mb4_bin"
    change_column :share_links, :folder_path, :string, null: false, collation: "utf8mb4_bin"
    change_column :photos, :folder_path, :string, null: false, collation: "utf8mb4_bin"
    change_column :access_rules, :folder_path, :string, null: false, collation: "utf8mb4_bin"
    change_column :folder_owners, :folder_path, :string, null: false, collation: "utf8mb4_bin"
    change_column :identities, :uid, :string, null: false, collation: "utf8mb4_bin"
  end

  private

  def mysql?
    connection.adapter_name.match?(/mysql|trilogy/i)
  end
end
