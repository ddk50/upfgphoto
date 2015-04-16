# -*- coding: utf-8 -*-
class ExplorersController < ApplicationController
  def index    
    page = params[:page] == nil ? 0 : params[:page].to_i  

    @photos = Photo.select("photos.*, count(activities.target_photo_id) as count")
      .joins(:activities)
      .group("activities.target_photo_id")
      .where(activities: {action_type: Activity.action_types[:like_photo]})
      .order('count DESC')
    
  end
end
