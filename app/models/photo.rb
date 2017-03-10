
class Photo < ActiveRecord::Base

  include Search

  belongs_to :employee 
  
  has_many :tag2photos, dependent: :destroy
  has_many :tags, through: :tag2photos
  
  has_one  :board2photo, dependent: :destroy
  has_one  :board, through: :board2photo
  
  has_many :activities, class_name: "Activity", foreign_key: :target_photo_id
  has_many :likecount, lambda { where(action_type: Activity.action_types[:like_photo]) }, class_name: "Activity", foreign_key: :target_photo_id

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

  def self.default_includes
    includes(:likecount, :tags, :tag2photos, :board, :board2photo)
  end
 
  def self.like_tag(param)
    if param.present?
      return where("photos.id IN ( #{Tag2photo.tag2photo_ids_for_tag(param).to_sql} )")
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
    if param.present? and (id = param.to_i)
      return where(employee_id: id)
    end
    all
  end

  def photo_limit(param)
    if !param.nil? and !param.to_s == ""
      return limit(param.to_i)
    end
    all
  end

  def self.omit_boarding_photos()
    ## omit photos that are submitted on boards
    includes(:board2photo).where(board2photos: {id: nil})
  end
  
end
