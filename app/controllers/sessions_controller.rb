# -*- coding: utf-8 -*-
class SessionsController < ApplicationController
  
  def create    
    granted = false
    nickname = request.env['omniauth.auth'][:info][:nickname].to_s

    ret = Whitelist.where(['nickname like ?', nickname])    
    if ret.present? 
      granted = check_user(ret.first)
    end
    
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
    if not employee.edited
      employee.update_attributes!(nickname: user.nickname,
                                  provider: user.provider,
                                  image_url: user.image_url,
                                  uid: user.uid,
                                  description: user.description,
                                  name: user.name)
    else
      employee.update_attributes!(image_url: user.image_url)
      employee.touch
      employee.save!
    end

    logger.debug("**************************** BACK_URL #{back_to} *********************************")
    
    redirect_to root_path, notice: 'ログインしました'
  end

  def destroy
    reset_session
    redirect_to root_path, notice: 'ログアウトしました'
  end

  private
  def check_user(user)
    if user.accepted? 
      if user.expires_at.present?
        if user.expires_at > Time.now
          return true
        else
          return false
        end
      else
        return true
      end
    else
      return false
    end    
  end

  def back_to
    begin
      if request.env['omniauth.origin'].present? && back_url = CGI.unescape(request.env['omniauth.origin'].to_s)
        uri = URI.parse(back_url)
        return uri if uri.relative? || uri.host == request.host
      end
      return root_path
    rescue
      return root_path
    end
  end
  
end
