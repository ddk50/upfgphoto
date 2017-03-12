# -*- coding: utf-8 -*-
class Activity < ActiveRecord::Base
  belongs_to :target_photo, class_name: "Photo", foreign_key: :target_photo_id
  belongs_to :target_employee, class_name: "Employee", foreign_key: :target_employee_id
  belongs_to :employee
  
  enum action_type: { poke_employee: 0, like_photo: 1, view_photo: 2, 
    upload_photo: 3, create_board: 4, censor_photo: 5  }
  
  validates_associated :employee
  validates_associated :target_employee
  validates_associated :target_photo, :allow_blank => true
  
  def self.poke(from, to)
    new = Activity.new(employee_id: from,
                       target_employee_id: to,
                       action_type: :poke_employee)
    new.save!
  end

  def self.recent_acts(limit, numofresult)
    day = 360
    begin
      f = includes(:target_photo, :target_employee, :employee).where('created_at > ?', day.days.ago).order('created_at desc')
      day += 360
    end while f.size < numofresult
    return f.group_by{|act| act.employee.id}.take(limit)
  end

  ##
  ## [FIXME] 消した写真が参照されていた場合はnilで例外がぶ飛
  ##
  def feed
    case self.action_type
    when "poke_employee" then
      sprintf("%sさんからPokeが届いています", self.employee.name)
    when "like_photo" then
      sprintf("%sさんが貴方の写真(%d)をいいねと言っています", 
              self.employee.name, self.target_photo_id)
    when "view_photo" then
      sprintf("%sさんが貴方の写真(%d)を見ました", self.employee.name, 
              self.target_photo_id)
    end
  end
  
end
