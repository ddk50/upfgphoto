# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20150617050136) do

  create_table "activities", force: true do |t|
    t.integer  "employee_id",                        null: false
    t.integer  "target_employee_id"
    t.integer  "target_photo_id"
    t.integer  "action_type",                        null: false
    t.boolean  "checked",            default: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text     "description"
  end

  add_index "activities", ["checked"], name: "index_activities_on_checked"
  add_index "activities", ["employee_id"], name: "index_activities_on_employee_id"
  add_index "activities", ["target_employee_id"], name: "index_activities_on_target_employee_id"
  add_index "activities", ["target_photo_id"], name: "index_activities_on_target_photo_id"

  create_table "board2employees", force: true do |t|
    t.integer  "employee_id",    null: false
    t.integer  "board_id",       null: false
    t.integer  "transaction_id", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "board2employees", ["board_id"], name: "index_board2employees_on_board_id"
  add_index "board2employees", ["employee_id"], name: "index_board2employees_on_employee_id"
  add_index "board2employees", ["transaction_id"], name: "index_board2employees_on_transaction_id"

  create_table "board2photos", force: true do |t|
    t.integer  "photo_id",   null: false
    t.integer  "board_id",   null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "board2photos", ["board_id"], name: "index_board2photos_on_board_id"
  add_index "board2photos", ["photo_id"], name: "index_board2photos_on_photo_id", unique: true

  create_table "boards", force: true do |t|
    t.integer  "employee_id",                 null: false
    t.string   "caption",                     null: false
    t.text     "description"
    t.boolean  "specialized", default: false, null: false
    t.boolean  "public",      default: false, null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.boolean  "guest",       default: false, null: false
  end

  add_index "boards", ["caption"], name: "index_boards_on_caption", unique: true
  add_index "boards", ["employee_id"], name: "index_boards_on_employee_id"

  create_table "employees", force: true do |t|
    t.string   "nickname"
    t.string   "provider"
    t.string   "image_url"
    t.string   "uid",                         null: false
    t.text     "description"
    t.string   "name"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "branch"
    t.string   "position"
    t.datetime "hiredate"
    t.datetime "birthdate"
    t.string   "address"
    t.string   "phone"
    t.string   "email"
    t.boolean  "existavatar", default: false
    t.boolean  "edited",      default: false
    t.integer  "rank",        default: 5,     null: false
  end

  add_index "employees", ["provider", "uid"], name: "index_employees_on_provider_and_uid", unique: true

  create_table "photos", force: true do |t|
    t.integer  "employee_id",                               null: false
    t.datetime "shotdate"
    t.string   "model"
    t.string   "exposure_time"
    t.string   "f_number"
    t.integer  "focal_length"
    t.integer  "focal_length_in_35mm_film"
    t.integer  "iso_speed_ratings"
    t.datetime "update_date_time"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "caption"
    t.text     "description"
    t.boolean  "censored",                  default: false, null: false
    t.boolean  "guest",                     default: false, null: false
  end

  add_index "photos", ["employee_id"], name: "index_photos_on_employee_id"
  add_index "photos", ["shotdate"], name: "index_photos_on_shotdate"

  create_table "tag2photos", force: true do |t|
    t.integer  "photo_id",   null: false
    t.integer  "tag_id",     null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "tag2photos", ["photo_id"], name: "index_tag2photos_on_photo_id"
  add_index "tag2photos", ["tag_id"], name: "index_tag2photos_on_tag_id"

  create_table "tags", force: true do |t|
    t.string   "name",       null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "tags", ["name"], name: "index_tags_on_name", unique: true

  create_table "transactions", force: true do |t|
    t.integer  "from_id",    null: false
    t.integer  "to_id",      null: false
    t.string   "uri_hash",   null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "status"
  end

  add_index "transactions", ["from_id"], name: "index_transactions_on_from_id"
  add_index "transactions", ["to_id"], name: "index_transactions_on_to_id"
  add_index "transactions", ["uri_hash"], name: "index_transactions_on_uri_hash"

  create_table "users", force: true do |t|
    t.string   "provider",    null: false
    t.string   "uid",         null: false
    t.string   "nickname",    null: false
    t.string   "image_url",   null: false
    t.text     "description"
    t.string   "name"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "users", ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true

  create_table "whitelists", force: true do |t|
    t.string   "nickname",    null: false
    t.datetime "expires_at"
    t.text     "description"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "status"
  end

  add_index "whitelists", ["nickname"], name: "index_whitelists_on_nickname", unique: true

end
