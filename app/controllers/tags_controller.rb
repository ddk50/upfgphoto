# -*- coding: utf-8 -*-

# PAGE_WINDOW_SIZE = 9

class TagsController < ApplicationController

  def show
    tagname = params[:tag]
    page = params[:page] == nil ? 0 : params[:page].to_i
    
    tag_id = Tag.find_by_name(tagname);
    @tagname = tagname
    photos = Tag2photo.where(tag_id: tag_id).offset(page * PHOTO_CONFIG['page_window_size']).limit(PHOTO_CONFIG['page_window_size']).order('photos.shotdate DESC')

    ##
    ## tagとの参照関係はのこってるけど、photoとの参照関係が    
    ## 切れた時Tag2Photoのエントリが残りますのでなんとかしましょう
    ##
    @photos = []
    photos.each{|p| 
      if not p.photo == nil
        @photos << p
      end
    }
    
    @photo_count = @photos.size
    @pages_count = (@photo_count % PHOTO_CONFIG['page_window_size']) > 0 ? 
                   ((@photo_count / PHOTO_CONFIG['page_window_size']) + 1) : 
                   @photo_count / PHOTO_CONFIG['page_window_size']
  end

  def gettags
    array = getrecentusetags(100)
    logger.debug("################### GETTAGS #{array.to_json} ##################")
    
    respond_to do |format|
      format.json {render :json => array.to_json }
    end
  end

  def hottags
    array = getrecentusetags(20)
    logger.debug("################### GETHOTTAGS #{array.to_json} ##################")
    
    respond_to do |format|
      format.json {render :json => array.to_json }
    end
  end

  def getrecentusetags(lim)
    Tag.order("updated_at DESC").limit(lim).map{|tag| tag.name }
  end

end