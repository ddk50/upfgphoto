# -*- coding: utf-8 -*-
class SessionsController < ApplicationController
  def create
    
    granted = false

    logger.debug("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb #{request.env['omniauth.auth'][:info][:nickname]}")    

    WHITE_LIST.each{|val|
      if val.to_s == request.env['omniauth.auth'][:info][:nickname].to_s
        granted = true
        break
      end      
    }
    
    if not granted
      redirect_to root_path, alert: 'メンバーではありません．管理人に連絡して追加してもらってください'
      return
    end

    user = User.find_or_create_from_auth_hash(request.env['omniauth.auth'])
    session[:user_id] = user.id

    logger.debug("aaaaaaaaaaaaaaaaaa #{user.description} #{user.name}")

    ##
    ## create an employee instance when logged in
    ##
    employee = Employee.find_or_create_by(uid: user.uid)
    employee.update(nickname: user.nickname,
                    provider: user.provider,
                    image_url: user.image_url,
                    uid: user.uid,
                    description: user.description,
                    name: user.name)
    
    redirect_to root_path, notice: 'ログインしました'
  end

  def destroy
    reset_session
    redirect_to root_path, notice: 'ログアウトしました'
  end
end
