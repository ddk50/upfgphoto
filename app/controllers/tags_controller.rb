# -*- coding: utf-8 -*-

class TagsController < ApplicationController

  before_action :authenticate_user!
  before_action :authenticate_guest!, except: [:gettags, :hottags, :edittags]

  def index
    order = params[:sort]
    sql = nil

    case order
    when /tag_count_desc/
      sql = "count DESC"
    when /tag_created_at_desc/
      sql = "tags.created_at desc"
    when /tag_updated_at_desc/
      sql = "tags.updated_at desc"
    else
      sql = "count DESC"
    end

    @tags = Tag.select("Tags.id, Tags.name, count(tag2photos.tag_id) as count")
      .joins(:tag2photos)
      .group("tag2photos.tag_id")
      .order(sql)
  end

  def gettags
    array = getrecentusetags(500)
    ##    logger.debug("################### GETTAGS #{array.to_json} ##################")
    
    respond_to do |format|
      format.json {render :json => array.to_json }
    end
  end

  def hottags
    array = getrecentusetags(20)
    ##    logger.debug("################### GETHOTTAGS #{array.to_json} ##################")
    
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
