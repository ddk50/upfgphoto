# -*- coding: utf-8 -*-

class InvalidFileFormat < StandardError; end
class InvalidFieldFormat < StandardError; end
class InvalidRequest < StandardError; end

class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  helper_method :current_user, :logged_in?, :current_employee
  helper_method :authenticate_user!, :unmarked_activities
  helper_method :authenticate_guest!, :authenticate_admin!

  helper_method :format_date_time

  include ComiketCsvHelper
  
  private
  def current_employee
    @current_employee ||= Employee.find_by_uid(current_user.uid)
  end

  def current_user
    return unless session[:user_id]
    @current_user ||= User.find(session[:user_id])
  end

  def logged_in?
    !!session[:user_id]
  end

  def authenticate_user!    
    if current_user == nil
      if params[:back_to].blank?
        redirect_to root_path, alert: "ログインしてください"
      else
        redirect_to '/auth/twitter2?origin=' + params[:back_to]
      end
    end
  end

  def authenticate_guest!
    if current_employee.guest?
      redirect_to boards_index_url(), alert: "権限がありません"
    end
  end

  def authenticate_admin!
    if (not current_employee.supervisor?) &&
        (not current_employee.supervisor_and_boardmember?)
      redirect_to root_path, alert: "権限がありません"
    end
  end

  def unmarked_activities
    current_employee.unmarked_activities
  end

  def format_date_time(str)
    begin
      if str && str.present?
        ret = str.to_datetime
        return ret
      end
    rescue ArgumentError
      logger.debug("##################### #{str} がパースできません} #################")
      return nil
    rescue => e
      logger.debug("##################### 不明なエラーです #################")
    end
    return nil
  end

  def checkfiletype(filepath)
    `file #{filepath}`
  end
  
end

