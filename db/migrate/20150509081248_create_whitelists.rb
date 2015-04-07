class CreateWhitelists < ActiveRecord::Migration
  def change
    create_table :whitelists do |t|
      t.string   :nickname, null: false
      t.boolean  :pending
      t.boolean  :declined
      t.datetime :declined_at
      t.boolean  :accepted
      t.datetime :accepted_at
      t.datetime :expires_at
      t.text     :description
      t.timestamps
    end
    add_index :whitelists, :nickname
  end
end
