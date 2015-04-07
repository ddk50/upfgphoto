# -*- coding: utf-8 -*-

class InvalidFieldFormat < StandardError; end

class ActivitiesController < ApplicationController

  before_action :authenticate_user!
  before_action :authenticate_guest!

  def index
    @activities = Activity.recent_acts(50)
  end
  
  def poke
    begin
      if params[:employee_id] == nil || 
          params[:employee_id] == ""
        raise InvalidFieldFormat, "従業員IDを指定してください"
      end      
      new_act = Activity.poke(current_employee.id, params[:employee_id].to_i)
    rescue => e
      redirect_to :back, alert: e.to_s
      return
    end

    redirect_to :back, notice: "Pokeしました"
  end

  def clearfeeds
    current_employee.mark_unread_activities
    redirect_to :back
  end

  def viewphoto
  end

  def likephoto
    err = false
    photo = nil
    err_msg = ""

    begin 
      if params[:photo_id] == nil || 
          params[:photo_id] == ""
        raise InvalidFieldFormat, "写真のIDを指定してください"
      end

      photo ||= Photo.find_by_id(params[:photo_id].to_i)

      if photo.employee.id == current_employee.id
        raise InvalidFieldFormat, "自作自演すんな"
      end

      photo.like!(current_employee)
      
    rescue => e
      err = true
      err_msg = e.to_s
    end
       
    if err
      logger.debug("***************************************** like (#{e.to_s}) **************************************")
      respond_to do |format|
        format.html { redirect_to :back, notice: err_msg }
        format.json { render :json => 
          { :status   => 'error',
            :msg => err_msg }
        }
      end
    else
      respond_to do |format|
        format.html { redirect_to :back, notice: "Likeしました" }
        format.json { render :json => 
          { :status   => 'success', 
            :msg => '' }
        }
      end
    end
    
  end

  
end
