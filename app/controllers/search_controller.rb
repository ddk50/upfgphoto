class SearchController < ApplicationController
  
  before_action :authenticate_user!
  before_action :authenticate_guest!, except: [:gettags, :hottags]  

  def index
    page = params[:page] == nil ? 0 : params[:page].to_i
    perpage = params[:perpage] == nil ? PHOTO_CONFIG['page_window_size'] : params[:perpage].to_i
    @keyword = params[:tag]

    @boards = Board.like_tag(params[:tag])

    rel = Photo.default_includes()
      .like_tag(params[:tag])
      .between_date(params[:start], params[:end])
      .photo_order(params[:sort])
    
    @photos = Kaminari.paginate_array(rel).page(page).per(perpage)
  end
end
