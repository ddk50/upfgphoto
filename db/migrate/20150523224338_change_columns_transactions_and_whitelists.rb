class ChangeColumnsTransactionsAndWhitelists < ActiveRecord::Migration[7.0]
  def change
    remove_column :whitelists, :pending, :boolean
    remove_column :whitelists, :declined, :boolean
    remove_column :whitelists, :declined_at, :datetime
    remove_column :whitelists, :accepted, :boolean
    remove_column :whitelists, :accepted_at, :datetime
    add_column :whitelists, :status, :integer

    remove_column :transactions, :pending, :boolean
    remove_column :transactions, :declined, :boolean
    remove_column :transactions, :declined_at, :datetime
    remove_column :transactions, :accepted, :boolean
    remove_column :transactions, :accepted_at, :datetime
    add_column :transactions, :status, :integer
  end
end
