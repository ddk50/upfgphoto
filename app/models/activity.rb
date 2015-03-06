# -*- coding: utf-8 -*-
class Activity < ActiveRecord::Base
  belongs_to :target_photo, class_name: "Photo", foreign_key: :id
  belongs_to :target_employee, class_name: "Employee", foreign_key: :id
  belongs_to :employee
  
  enum action_type: { poke_employee: 0, like_photo: 1, view_photo: 2 }
  
  validates_associated :employee
  validates_associated :target_employee
  validates_associated :target_photo, :allow_blank => true
  
  def self.poke(from, to)
    new = Activity.new(employee_id: from,
                       target_employee_id: to,
                       action_type: :poke_employee)
    new.save!
  end

  def feed
    case self.action_type
    when "poke_employee" then
      sprintf("%sさんからPokeが届いています", self.employee.name)
    when "like_photo" then
      sprintf("%sさんが貴方の写真(%d)をいいねと言っています", 
              self.employee.name, self.target_photo.id)
    when "view_photo" then
      sprintf("%sさんが貴方の写真(%d)を見ました", self.employee.name, 
              self.target_photo.id)
    end
  end
  
end
