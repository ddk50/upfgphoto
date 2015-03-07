class SearchController < ApplicationController
  def index
    page = params[:page] == nil ? 0 : params[:page].to_i
    perpage = params[:perpage] == nil ? PHOTO_CONFIG['page_window_size'] : params[:perpage].to_i
    @keyword = params[:tag]

    rel = Photo
      .like_tag(params[:tag])
      .between_date(params[:start], params[:end])
      .photo_order(params[:sort])

    @photos = rel.offset(page * perpage).limit(perpage)

    @photo_count = rel.size
    @current_page = page
    @pages_count = (@photo_count % perpage) > 0 ? 
                   ((@photo_count / perpage) + 1) : 
                   @photo_count / perpage    
    
  end
end