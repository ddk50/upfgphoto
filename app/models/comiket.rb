class Comiket < ActiveRecord::Base
  belongs_to :employee

  def self.uploader_count
    Comiket.distinct.count(:employee_id)
  end
end
