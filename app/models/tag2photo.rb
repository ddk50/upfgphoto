# -*- coding: utf-8 -*-

require 'search_module'

class Tag2photo < ActiveRecord::Base
##
## tagとの参照関係はのこってるけど、photoとの参照関係が
## 切れた時Tag2Photoのエントリが残りますのでなんとかしましょう
##
  include Search

  belongs_to :tag
  belongs_to :photo

  validates_uniqueness_of :photo_id, :scope => [:tag_id]

  default_scope { includes(:photo) }

  def self.each_tags(photo_id)
    tags = Tag2photo.where(photo_id: photo_id)
    tags.each{|t|
      yield t.tag
    }
  end

  # def self.photo_order(param)
  #   Search::photo_order(param)
  # end

end
