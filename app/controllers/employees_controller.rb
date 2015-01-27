
PAGE_WINDOW_SIZE = 9

class EmployeesController < ApplicationController

  before_action :authenticate_user!, except: :index

  def index    
  end

  def show
    id = params[:id].to_i
    page = params[:page] == nil ? 0 : params[:page].to_i
    sort = params[:sort]

    case sort
    when nil
      order = 'created_at desc'
    when 'asc' then
      order = 'shotdate asc'
    when 'desc' then
      order = 'shotdate desc'
    when 'uploaddesc' then
      order = 'created_at desc'
    end

    start = nil
    endt = nil

    if order == 'uploaddesc'
      @photos = Photo.where(employee_id: id).offset(page * PAGE_WINDOW_SIZE).limit(PAGE_WINDOW_SIZE).order(order)
      @photo_count = Photo.where(employee_id: id).size
    else
      if params[:end] && params[:start]
        start = Time.zone.parse(params[:start])
        endt  = Time.zone.parse(params[:end])
        @photos = Photo.where(employee_id: id, shotdate: start..endt).offset(page * PAGE_WINDOW_SIZE).limit(PAGE_WINDOW_SIZE).order(order)
        @photo_count = Photo.where(employee_id: id, shotdate: start..endt).size
      else
        @photos = Photo.where(employee_id: id).offset(page * PAGE_WINDOW_SIZE).limit(PAGE_WINDOW_SIZE).order(order)
        @photo_count = Photo.where(employee_id: id).size
      end
    end
   
    @page = page
    @employee = Employee.find_by_id(id)   
    @pages_count = (@photo_count % PAGE_WINDOW_SIZE) > 0 ? 
                   ((@photo_count / PAGE_WINDOW_SIZE) + 1) : 
                   @photo_count / PAGE_WINDOW_SIZE
    
  end
end
