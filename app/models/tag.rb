# -*- coding: utf-8 -*-
class Tag < ActiveRecord::Base
  has_many :tag2photos
  has_many :photos, through: :tag2photos
##  has_many :photo, through: tag2photos
  validate :name, :uniqueness => true

  def self.counts
    Tag.select("Tags.name, count(tag2photos.tag_id) as count")
      .joins(:tag2photos)
      .group("tag2photos.tag_id")
  end

  def self.update_or_create_tag(tagname)
    tag = Tag.find_or_initialize_by(name: tagname);
    tag.name = tagname;
    tag.save!
    return tag.id
  end

end
