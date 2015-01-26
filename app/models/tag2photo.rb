# -*- coding: utf-8 -*-
class Tag2photo < ActiveRecord::Base
##
## tagとの参照関係はのこってるけど、photoとの参照関係が
## 切れた時Tag2Photoのエントリが残りますのでなんとかしましょう
##
  belongs_to :tag
  belongs_to :photo

  validates_uniqueness_of :photo_id, :scope => [:tag_id]

  default_scope { includes(:photo) }
end
