
PAGE_WINDOW_SIZE = 9

class EmployeesController < ApplicationController
  def index    
  end

  def show
    id = params[:id].to_i
    page = params[:page] == nil ? 0 : params[:page].to_i
   
    @employee = Employee.find_by_id(id)   
    @photos = Photo.where(employee_id: id).offset(page * PAGE_WINDOW_SIZE).limit(PAGE_WINDOW_SIZE)        
    
    @photo_count = Photo.where(employee_id: id).size    
    @pages_count = (@photo_count % PAGE_WINDOW_SIZE) > 0 ? 
                   ((@photo_count / PAGE_WINDOW_SIZE) + 1) : 
                   @photo_count / PAGE_WINDOW_SIZE
    
  end
end
