# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_07_19_060000) do
  create_table "access_rule_members", force: :cascade do |t|
    t.integer "access_rule_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["access_rule_id", "user_id"], name: "index_access_rule_members_on_access_rule_id_and_user_id", unique: true
    t.index ["access_rule_id"], name: "index_access_rule_members_on_access_rule_id"
    t.index ["user_id"], name: "index_access_rule_members_on_user_id"
  end

  create_table "access_rules", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "folder_path", null: false
    t.string "mode", null: false
    t.datetime "updated_at", null: false
    t.index ["folder_path"], name: "index_access_rules_on_folder_path", unique: true
  end

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "folder_owners", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "folder_path", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["folder_path"], name: "index_folder_owners_on_folder_path", unique: true
    t.index ["user_id"], name: "index_folder_owners_on_user_id"
  end

  create_table "identities", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "provider", null: false
    t.string "uid", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["provider", "uid"], name: "index_identities_on_provider_and_uid", unique: true
    t.index ["user_id"], name: "index_identities_on_user_id"
  end

  create_table "photos", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.json "exif"
    t.string "file_name", null: false
    t.string "folder_path", null: false
    t.datetime "taken_at", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["folder_path"], name: "index_photos_on_folder_path"
    t.index ["taken_at"], name: "index_photos_on_taken_at"
    t.index ["user_id"], name: "index_photos_on_user_id"
  end

  create_table "share_links", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "folder_path", null: false
    t.datetime "issued_at", null: false
    t.integer "issued_by_id", null: false
    t.datetime "revoked_at"
    t.integer "revoked_by_id"
    t.string "revoked_reason"
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.index ["folder_path"], name: "index_share_links_on_folder_path"
    t.index ["issued_by_id"], name: "index_share_links_on_issued_by_id"
    t.index ["revoked_by_id"], name: "index_share_links_on_revoked_by_id"
    t.index ["token"], name: "index_share_links_on_token", unique: true
  end

  create_table "taggings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "photo_id", null: false
    t.integer "tag_id", null: false
    t.datetime "updated_at", null: false
    t.index ["photo_id", "tag_id"], name: "index_taggings_on_photo_id_and_tag_id", unique: true
    t.index ["photo_id"], name: "index_taggings_on_photo_id"
    t.index ["tag_id"], name: "index_taggings_on_tag_id"
  end

  create_table "tags", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_tags_on_name", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.string "email"
    t.datetime "expires_at"
    t.string "name", null: false
    t.string "nickname", null: false
    t.string "role", default: "user", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email"
  end

  add_foreign_key "access_rule_members", "access_rules"
  add_foreign_key "access_rule_members", "users"
  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "folder_owners", "users"
  add_foreign_key "identities", "users"
  add_foreign_key "photos", "users"
  add_foreign_key "share_links", "users", column: "issued_by_id"
  add_foreign_key "share_links", "users", column: "revoked_by_id"
  add_foreign_key "taggings", "photos"
  add_foreign_key "taggings", "tags"
end
