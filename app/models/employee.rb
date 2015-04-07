class Employee < ActiveRecord::Base
  has_many :photos
  has_many :boards
  has_many :sent_activities, class_name: "Activity", foreign_key: :employee_id
  has_many :received_activities, class_name: "Activity", foreign_key: :target_employee_id

  has_many :sent_transactions, class_name: "Transaction", foreign_key: :from
  has_many :received_transactions, class_name: "Transaction", foreign_key: :to
  
  enum rank: { supervisor: 0, supervisor_and_boardmember: 1, 
    board_member: 2, branch_manager: 3, candidate: 4, guest: 5} 

  def unmarked_activities
    Activity.where(checked: false, target_employee_id: self.id)
  end

  def mark_unread_activities
    Activity.where(checked: false, target_employee_id: self.id).update_all(checked: true)
  end
end
