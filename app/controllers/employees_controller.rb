
PAGE_WINDOW_SIZE = 9

class EmployeesController < ApplicationController
  def index    
  end

  def show
    id = params[:id].to_i
    page = params[:page] == nil ? 0 : params[:page].to_i
    sort = params[:sort] == 'asc' ? 'asc' : 'desc'   

    if params[:end] && params[:start]
      start = Time.zone.parse(params[:start])
      endt  = Time.zone.parse(params[:end])
      @photos = Photo.where(employee_id: id, shotdate: start..endt).offset(page * PAGE_WINDOW_SIZE).limit(PAGE_WINDOW_SIZE).order("shotdate #{sort}")
    else
      @photos = Photo.where(employee_id: id).offset(page * PAGE_WINDOW_SIZE).limit(PAGE_WINDOW_SIZE).order("shotdate #{sort}")
    end
   
    @employee = Employee.find_by_id(id)   
    
    @photo_count = Photo.where(employee_id: id).size    
    @pages_count = (@photo_count % PAGE_WINDOW_SIZE) > 0 ? 
                   ((@photo_count / PAGE_WINDOW_SIZE) + 1) : 
                   @photo_count / PAGE_WINDOW_SIZE
    
  end
end
