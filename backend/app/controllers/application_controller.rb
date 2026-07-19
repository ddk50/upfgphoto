class ApplicationController < ActionController::Base
  allow_browser versions: :modern

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id])
  end

  def require_login
    head :unauthorized unless current_user
  end

  def require_approved
    require_login
    return if performed?
    head :forbidden unless current_user.approved? && !current_user.expired?
  end

  def require_admin
    require_approved
    return if performed?
    head :forbidden unless current_user.admin_role?
  end
end
