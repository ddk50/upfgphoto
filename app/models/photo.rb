
require 'search_module'

class Photo < ActiveRecord::Base

  include Search

  belongs_to :employee 
  has_many :tag2photos, dependent: :destroy
  has_many :tags, through: :tag2photos
  has_many :activities, class_name: "Activity", foreign_key: :target_photo_id
  has_many :likecount, lambda { where(action_type: Activity.action_types[:like_photo]) }, class_name: "Activity", foreign_key: :target_photo_id

  default_scope { includes(:tags) }
##  default_scope { includes(:activities) } 
  default_scope { includes(:likecount) } 

  def like!(current_employee)
    new = Activity.new(employee_id: current_employee.id,
                       target_employee_id: self.employee.id,
                       target_photo_id: self.id,
                       action_type: :like_photo)
    new.save!    
  end

  def view!(current_employee)
    new = Activity.new(employee_id: current_employee.id,
                       target_employee_id: self.employee.id,
                       target_photo_id: self.id,
                       action_type: :view_photo)
    new.save!    
  end
 
  def self.like_tag(param)
    if not param.nil? and not param.to_s == ""
      return joins(:tags).where(['tags.name like ?', "%#{param}%"])
    end
    all
  end

  def self.between_date(startdate, enddate)    
    if !startdate.nil? and !enddate.nil? 
      begin
        return where(shotdate: DateTime.parse(startdate.to_s)..DateTime.parse(enddate.to_s))
      rescue ArgumentError
      end        
    end
    all
  end

  def self.employee_photo(param)
    if !param.nil? and (id = param.to_i)
      return where(employee_id: id)
    end
    all
  end

  # def self.photo_order(param)
  #   Search::photo_order(param)
  # end

  def photo_limit(param)
    if !param.nil? and !param.to_s == ""
      return limit(param.to_i)
    end
    all
  end
  
end
