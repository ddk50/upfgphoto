class Board2employee < ActiveRecord::Base
  belongs_to :board
  belongs_to :employee
  belongs_to :trans, class_name: "Transaction", foreign_key: :transaction_id, dependent: :destroy

  validates_uniqueness_of :board_id, :scope => [:employee_id]
end
