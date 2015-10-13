# -*- coding: utf-8 -*-
class AdminController < ApplicationController

  before_action :authenticate_user!
  before_action :authenticate_admin!
  
  def index
    @users = Whitelist.all
    @employees = Employee.all
  end

  def new
    nickname    = params[:nickname]
    status      = params[:state]
    description = params[:description]
    date = format_date_time(params[:date])

    begin
      user = Whitelist.new(nickname: nickname,
                           description: description,
                           expires_at: date)
      case status
      when "accepted"
        user.accepted!
      when "pending"
        user.pending!
      when "declined"
        user.declined!
      end
      
      user.save!
      
      redirect_to :back, notice: "ユーザを追加しました"
    rescue ActiveRecord::RecordNotUnique
      redirect_to :back, alert: "twitter nameはユニークでなければなりません"
    rescue ActiveRecord::RecordInvalid
      redirect_to :back, alert: "twitter nameは必ず指定しなければなりません"
    rescue => e
      redirect_to :back, alert: "不明なエラーが発生しました"
    end
  end

  def delete
    id = params[:id]
    user = Whitelist.find_by_id(id)

    if user.present?
      user.delete
      redirect_to :back, notice: "ユーザ#{id}を削除"
    else
      redirect_to :back, notice: "ユーザIDが不正です"
    end
  end

  def authority_edit
    id     = params[:id]
    status = params[:status]    
    employee = Employee.find_by_id(id)
    if employee.present?
      case status
      when "supervisor"
        employee.supervisor!
      when "supervisor_and_boardmember"
        employee.supervisor_and_boardmember!
      when "board_member"
        employee.board_member!
      when "branch_manager"
        employee.branch_manager!
      when "candidate"
        employee.candidate!
      when "guest"
        employee.guest!
      end
      employee.save!
      redirect_to :back, notice: "社員#{id}の権限を変更"
    else
      redirect_to :back, notice: "ユーザIDが不正です"
    end
  end

  def user_edit    
    id     = params[:id]
    status = params[:state]
    date   = format_date_time(params[:date])
    
    user = Whitelist.find_by_id(id)
    
    if user.present?
      
      user.expires_at = date
      
      case status
      when "accepted"
        user.accepted!
      when "pending"
        user.pending!
      when "declined"
        user.declined!
      end
      
      user.save!

      redirect_to :back, notice: "ユーザ#{id}編集しました"
    else
      redirect_to :back, notice: "ユーザIDが不正です"
    end
  end 
  
end
