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

ActiveRecord::Schema.define(version: 20150204112628) do

  create_table "employees", force: true do |t|
    t.string   "nickname"
    t.string   "provider"
    t.string   "image_url"
    t.string   "uid",         null: false
    t.text     "description"
    t.string   "name"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "employees", ["provider", "uid"], name: "index_employees_on_provider_and_uid", unique: true

  create_table "photos", force: true do |t|
    t.integer  "employee_id",               null: false
    t.string   "filepath"
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
  end

  add_index "photos", ["shotdate"], name: "index_photos_on_shotdate"

  create_table "tag2photos", force: true do |t|
    t.integer  "photo_id",   null: false
    t.integer  "tag_id",     null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "tag2photos", ["photo_id", "tag_id"], name: "index_tag2photos_on_photo_id_and_tag_id"

  create_table "tags", force: true do |t|
    t.string   "name",       null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "tags", ["name"], name: "index_tags_on_name", unique: true

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

end
