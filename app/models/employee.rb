class Employee < ActiveRecord::Base
  has_many :photos
  has_many :sent_activities, class_name: "Activity", foreign_key: :employee_id
  has_many :received_activities, class_name: "Activity", foreign_key: :target_employee_id

  def unmarked_activities
    Activity.where(checked: false, target_employee_id: self.id)
  end

  def mark_unread_activities
    Activity.where(checked: false, target_employee_id: self.id).update_all(checked: true)
  end
end
