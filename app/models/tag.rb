# -*- coding: utf-8 -*-
class Tag < ActiveRecord::Base
  has_many :tag2photos
  has_many :photos, through: :tag2photos
##  has_many :photo, through: tag2photos
  validate :name, :uniqueness => true

  def self.counts
    self.select("name, count(tag2photos.tag_id) as count").join(:tag2photos).group("tag2photos.tag_id").to_a
  end

end
