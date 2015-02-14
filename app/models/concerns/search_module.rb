module Search
  extend ActiveSupport::Concern

  included do
    def self.photo_order(param)
      case param
      when /photo_shot_date_desc/
        order('photos.shotdate DESC')
      when /photo_shot_date_asc/
        order('photos.shotdate ASC')
      when /photo_upload_date_desc/       
        order('photos.created_at DESC')
      else
        all
      end    
    end
  end

end
