
PAGE_WINDOW_SIZE = 9

class EmployeesController < ApplicationController

  before_action :authenticate_user!, except: :index

  def index    
  end

  def show
    id = params[:id].to_i
    page = params[:page] == nil ? 0 : params[:page].to_i
    sort = params[:sort] == 'asc' ? 'asc' : 'desc'   

    start = nil
    endt = nil

    if params[:end] && params[:start]
      start = Time.zone.parse(params[:start])
      endt  = Time.zone.parse(params[:end])
      @photos = Photo.where(employee_id: id, shotdate: start..endt).offset(page * PAGE_WINDOW_SIZE).limit(PAGE_WINDOW_SIZE).order("shotdate #{sort}")
    else
      @photos = Photo.where(employee_id: id).offset(page * PAGE_WINDOW_SIZE).limit(PAGE_WINDOW_SIZE).order("shotdate #{sort}")
    end
   
    @employee = Employee.find_by_id(id)   
    
    if params[:end] && params[:start]
      @photo_count = Photo.where(employee_id: id, shotdate: start..endt).size
    else
      @photo_count = Photo.where(employee_id: id).size
    end
    @pages_count = (@photo_count % PAGE_WINDOW_SIZE) > 0 ? 
                   ((@photo_count / PAGE_WINDOW_SIZE) + 1) : 
                   @photo_count / PAGE_WINDOW_SIZE
    
  end
end
