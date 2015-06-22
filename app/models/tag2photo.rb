# -*- coding: utf-8 -*-

class Tag2photo < ActiveRecord::Base
##
## tagとの参照関係はのこってるけど、photoとの参照関係が
## 切れた時Tag2Photoのエントリが残りますのでなんとかしましょう
##
  include Search

  belongs_to :tag
  belongs_to :photo

  validates_uniqueness_of :photo_id, :scope => [:tag_id]

  def self.tag2photo_ids_for_tag(tag_name)
    joins(:tag).where(['tags.name like ?', "%#{tag_name}%"]).select(:photo_id)
  end

end
