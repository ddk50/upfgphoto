# -*- coding: utf-8 -*-

class TagsController < ApplicationController

  before_action :authenticate_user!
  before_action :authenticate_guest!, except: [:gettags, :hottags]

  def index
    tags = Tag.includes(:photos).all
    @tags = tags.sort {|x, y| -(x.photos.size <=> y.photos.size) }
  end

  def show
    tagname = params[:tag]
    page = params[:page] == nil ? 0 : params[:page].to_i
    
    tag_id = Tag.find_by_name(tagname)
    
    @tagname = tagname
    rel = Tag2photo.where(tag_id: tag_id)

    @photos = rel
      .offset(page * PHOTO_CONFIG['page_window_size'])
      .limit(PHOTO_CONFIG['page_window_size'])
      .photo_order(params[:sort])
    
    @photo_count = rel.size

    # ##
    # ## tagとの参照関係はのこってるけど、photoとの参照関係が    
    # ## 切れた時Tag2Photoのエントリが残りますのでなんとかしましょう
    # ##
    # ## [FIXME] Tag2Photoのエントリが残る!!
    # ##
    # @photos = []
    # photos.each{|p| 
    #   if not p.photo == nil
    #     @photos << p
    #   end
    # }
    
    @current_page = page
    @pages_count = (@photo_count % PHOTO_CONFIG['page_window_size']) > 0 ? 
                   ((@photo_count / PHOTO_CONFIG['page_window_size']) + 1) : 
                   @photo_count / PHOTO_CONFIG['page_window_size']
  end

  def gettags
    array = getrecentusetags(500)
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

  def edittags
    newtags = params[:tags] == nil ? [] : params[:tags]
    photoid = params[:photoid]
   
    err = false

    if photoid == nil
      respond_to do |format|
        format.json { render :json => 
          {:status   => 'error',
           :msg => '写真IDが指定されていません'}
        }
      end
      return
    end
    
    begin      
      ActiveRecord::Base.transaction do
        tags = Tag2photo.where(photo_id: photoid)
        tags.delete_all

        newtags.each{|t|
          tag_id = Tag.update_or_create_tag(t)
          newt = Tag2photo.new(photo_id: photoid, tag_id: tag_id)
          newt.save!
        }
      end      
    rescue => e
      err = true
    end

    if err
      respond_to do |format|
        format.json { render :json => 
          {:status   => 'error'} 
        }
      end
    else
      respond_to do |format|
        format.json { render :json => 
          {:status   => 'success'} 
       }
      end
    end
    
  end

  def getrecentusetags(lim)
    Tag.order("updated_at DESC").limit(lim).map{|tag| tag.name }
  end

end
