# -*- coding: utf-8 -*-
class SessionsController < ApplicationController
  def create
    user = User.find_or_create_from_auth_hash(request.env['omniauth.auth'])
    session[:user_id] = user.id

    ##
    ## create an employee instance when logged in
    ##
    employee = Employee.find_or_create_by(uid: user.uid)
    employee.update(nickname: user.nickname,
                    provider: user.provider,
                    nickname: user.nickname,
                    image_url: user.image_url,
                    uid: user.uid)
    
    redirect_to root_path, notice: 'ログインしました'
  end

  def destroy
    reset_session
    redirect_to root_path, notice: 'ログアウトしました'
  end
end
