class CreateCoreSchema < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.string :nickname, null: false
      t.string :avatar_url
      t.string :email
      t.string :role, null: false, default: "user"
      t.string :status, null: false, default: "pending"
      t.datetime :expires_at
      t.timestamps
    end
    add_index :users, :email

    # Twitter UID / Google sub のどちらからでも user に解決するための認証識別子。
    # 所有・紐づけはすべて users.id が担い、provider uid は認証境界にのみ現れる (ADR-020)
    create_table :identities do |t|
      t.references :user, null: false, foreign_key: true
      t.string :provider, null: false
      t.string :uid, null: false
      t.string :email
      t.timestamps
    end
    add_index :identities, [ :provider, :uid ], unique: true

    # フォルダは実体を持たず folder_path 文字列から導出される (ADR-003)
    create_table :photos do |t|
      t.references :user, null: false, foreign_key: true # uploader
      t.string :folder_path, null: false
      t.string :file_name, null: false
      t.string :title, null: false
      t.datetime :taken_at, null: false
      t.json :exif
      t.timestamps
    end
    add_index :photos, :folder_path
    add_index :photos, :taken_at

    create_table :tags do |t|
      t.string :name, null: false
      t.timestamps
    end
    add_index :tags, :name, unique: true

    create_table :taggings do |t|
      t.references :photo, null: false, foreign_key: true
      t.references :tag, null: false, foreign_key: true
      t.timestamps
    end
    add_index :taggings, [ :photo_id, :tag_id ], unique: true

    # フォルダ単位アクセス制御。未登録パスは親から継承 (ADR-005)
    create_table :access_rules do |t|
      t.string :folder_path, null: false
      t.string :mode, null: false # everyone / restricted / guest
      t.timestamps
    end
    add_index :access_rules, :folder_path, unique: true

    create_table :access_rule_members do |t|
      t.references :access_rule, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.timestamps
    end
    add_index :access_rule_members, [ :access_rule_id, :user_id ], unique: true

    # 共有URL台帳: 停止してもエントリは残す (ADR-018)。
    # 有効リンク = revoked_at IS NULL の行
    create_table :share_links do |t|
      t.string :token, null: false
      t.string :folder_path, null: false
      t.references :issued_by, null: false, foreign_key: { to_table: :users }
      t.datetime :issued_at, null: false
      t.datetime :revoked_at
      t.references :revoked_by, foreign_key: { to_table: :users }
      t.string :revoked_reason # manual / parent-override
      t.timestamps
    end
    add_index :share_links, :token, unique: true
    add_index :share_links, :folder_path

    # オーナー = パスを最初に実体化した人 (ADR-019)
    create_table :folder_owners do |t|
      t.string :folder_path, null: false
      t.references :user, null: false, foreign_key: true
      t.timestamps
    end
    add_index :folder_owners, :folder_path, unique: true
  end
end
