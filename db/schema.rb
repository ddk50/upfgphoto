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

ActiveRecord::Schema[7.0].define(version: 2017_07_07_131550) do
  create_table "activities", force: :cascade do |t|
    t.integer "employee_id", null: false
    t.integer "target_employee_id"
    t.integer "target_photo_id"
    t.integer "action_type", null: false
    t.boolean "checked", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "description"
    t.index ["checked"], name: "index_activities_on_checked"
    t.index ["employee_id"], name: "index_activities_on_employee_id"
    t.index ["target_employee_id"], name: "index_activities_on_target_employee_id"
    t.index ["target_photo_id"], name: "index_activities_on_target_photo_id"
  end

  create_table "board2employees", force: :cascade do |t|
    t.integer "employee_id", null: false
    t.integer "board_id", null: false
    t.integer "transaction_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["board_id"], name: "index_board2employees_on_board_id"
    t.index ["employee_id"], name: "index_board2employees_on_employee_id"
    t.index ["transaction_id"], name: "index_board2employees_on_transaction_id"
  end

  create_table "board2photos", force: :cascade do |t|
    t.integer "photo_id", null: false
    t.integer "board_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["board_id"], name: "index_board2photos_on_board_id"
    t.index ["photo_id"], name: "index_board2photos_on_photo_id", unique: true
  end

  create_table "boards", force: :cascade do |t|
    t.integer "employee_id", null: false
    t.string "caption", null: false
    t.text "description"
    t.boolean "specialized", default: false, null: false
    t.boolean "public", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "guest", default: false, null: false
    t.index ["caption"], name: "index_boards_on_caption", unique: true
    t.index ["employee_id"], name: "index_boards_on_employee_id"
  end

  create_table "comikets", force: :cascade do |t|
    t.integer "employee_id", null: false
    t.integer "color", default: 0, null: false
    t.string "date"
    t.string "chiku"
    t.string "space"
    t.string "shima"
    t.string "circle_name"
    t.string "zokusei"
    t.string "item"
    t.integer "tanka"
    t.integer "hattyusu"
    t.string "hattyusha"
    t.text "bikou"
    t.integer "point"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["employee_id"], name: "index_comikets_on_employee_id"
  end

  create_table "employees", force: :cascade do |t|
    t.string "nickname"
    t.string "provider"
    t.string "image_url"
    t.string "uid", null: false
    t.text "description"
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "branch"
    t.string "position"
    t.datetime "hiredate"
    t.datetime "birthdate"
    t.string "address"
    t.string "phone"
    t.string "email"
    t.boolean "existavatar", default: false
    t.boolean "edited", default: false
    t.integer "rank", default: 5, null: false
    t.index ["provider", "uid"], name: "index_employees_on_provider_and_uid", unique: true
  end

  create_table "photos", force: :cascade do |t|
    t.integer "employee_id", null: false
    t.datetime "shotdate"
    t.string "model"
    t.string "exposure_time"
    t.string "f_number"
    t.integer "focal_length"
    t.integer "focal_length_in_35mm_film"
    t.integer "iso_speed_ratings"
    t.datetime "update_date_time"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "caption"
    t.text "description"
    t.boolean "censored", default: false, null: false
    t.boolean "guest", default: false, null: false
    t.index ["employee_id"], name: "index_photos_on_employee_id"
    t.index ["shotdate"], name: "index_photos_on_shotdate"
  end

  create_table "tag2photos", force: :cascade do |t|
    t.integer "photo_id", null: false
    t.integer "tag_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["photo_id"], name: "index_tag2photos_on_photo_id"
    t.index ["tag_id"], name: "index_tag2photos_on_tag_id"
  end

  create_table "tags", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_tags_on_name", unique: true
  end

  create_table "transactions", force: :cascade do |t|
    t.integer "from_id", null: false
    t.integer "to_id", null: false
    t.string "uri_hash", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "status"
    t.index ["from_id"], name: "index_transactions_on_from_id"
    t.index ["to_id"], name: "index_transactions_on_to_id"
    t.index ["uri_hash"], name: "index_transactions_on_uri_hash"
  end

  create_table "users", force: :cascade do |t|
    t.string "provider", null: false
    t.string "uid", null: false
    t.string "nickname", null: false
    t.string "image_url", null: false
    t.text "description"
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true
  end

  create_table "whitelists", force: :cascade do |t|
    t.string "nickname", null: false
    t.datetime "expires_at"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "status"
    t.index ["nickname"], name: "index_whitelists_on_nickname", unique: true
  end

end
