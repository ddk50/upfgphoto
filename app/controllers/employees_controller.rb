# -*- coding: utf-8 -*-

class EmployeesController < ApplicationController
  
  before_action :authenticate_user!
  before_action :authenticate_guest!, except: :index

  def index    
    ##
    ## [FIXME] Can it write in SQL?
    ##
    @employees = Employee.includes(:photos).all.sort {|x, y| y.photos.size <=> x.photos.size}
  end

  def profile
    id = params[:id]
    @employee = Employee.find_by_id(id)
  end
  
  def avatar
    employee_id = params[:id]
    send_file("#{PHOTO_CONFIG['avatar_dir']}/#{employee_id}.jpg",
              type: "image/jpeg",
              filename: "#{employee_id}.jpg");
  end

  def edit
    employee_id = params[:id].to_i
    name = params[:name]
    branch = params[:branch]
    email = params[:email]
    position = params[:position]
    hiredate = format_date_time(params[:hiredate])
    birthdate = format_date_time(params[:birthdate])
    address = params[:address]
    phone = params[:phone]
    avatar = params[:target_file_avatar]
    description = params[:description]
    avatar_uploaded = false

    if employee_id != current_employee.id
      redirect_to employee_profile_url(employee_id), alert: "他人のプロフィールは編集できません"
      return
    end

    employee = Employee.find_by_id(employee_id)

    if avatar != nil
      File.open("#{PHOTO_CONFIG['avatar_dir']}/#{employee_id}.jpg", 'wb') do |newfile|
        newfile.write(avatar.read)
      end
      avatar_uploaded = true
    end
    
    employee.update!(name: name,
                     branch: branch,
                     position: position,
                     email: email,
                     hiredate: hiredate,
                     birthdate: birthdate,
                     address: address,
                     phone: phone,
                     description: description,
                     edited: true,
                     existavatar: avatar_uploaded)

    redirect_to employee_profile_url(employee_id), notice: "プロフィール書き換え完了"
    
  end

  def show
    id = params[:id].to_i
    page = params[:page] == nil ? 0 : params[:page].to_i
    perpage = (params[:perpage] == nil || 
               params[:perpage] == "") ? PHOTO_CONFIG['page_window_size'] : params[:perpage].to_i

    @employee = Employee.find_by_id(id)

    @photos = Photo.default_includes().employee_photo(id)
      .like_tag(params[:tag])
      .between_date(params[:start], params[:end])
      .photo_order(params[:sort]) 
      .page(page).per(perpage)
  end

end
