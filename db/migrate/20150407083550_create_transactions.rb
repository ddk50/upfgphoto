class CreateTransactions < ActiveRecord::Migration
  def change
    create_table :transactions do |t|
      t.integer :from_id, null: false
      t.integer :to_id, null: false
      t.boolean :pending
      t.boolean :declined
      t.datetime :declined_at
      t.boolean :accepted
      t.datetime :accepted_at
      t.string :uri_hash, null: false
      t.timestamps
    end
    add_index :transactions, :from_id
    add_index :transactions, :to_id
    add_index :transactions, :uri_hash
  end
end
