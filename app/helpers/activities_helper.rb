# -*- coding: utf-8 -*-

module ActivitiesHelper

  def pprint_action_type(act)
    case act.action_type
    when "poke_employee"
      "#{act.employee.name} さんが <a href='#{employee_profile_url(act.target_employee_id)}'>#{act.target_employee.name}</a> さんにPokeしました".html_safe
    when "like_photo"
      photo_thumbnail_url = photo_thumbnail_url(id: act.target_photo_id, type: 'small')
      photo_view_url = photo_view_url(act.target_photo_id)
      ret = <<"EOS"
#{act.employee.name} さんが <a href='#{photo_view_url}'> <img src='#{photo_thumbnail_url}'> </a> をいいね！と言っています
EOS
      return ret.html_safe
    when "upload_photo"      
      photo_thumbnail_url = photo_thumbnail_url(id: act.target_photo_id, type: 'small')
      photo_view_url = photo_view_url(act.target_photo_id)
      ret = <<"EOS"
#{act.employee.name} さんが #{get_board_name_if_not_null(act)}アップロードしました <a href='#{photo_view_url}'><img src='#{photo_thumbnail_url}'></a>
EOS
      return ret.html_safe
    when "create_board"
      "#{act.employee.name} さんが 新しいボードを作成しました".html_safe
    else
      "#{act.action_type}".html_safe
    end
  end

  def get_board_name_if_not_null(act)
    if act.target_photo != nil
      if act.target_photo.board != nil
        ret = "<a href='#{boards_show_url(act.target_photo.board.id)}'>#{act.target_photo.board.caption}</a>" + " に"
        return ret.html_safe
      else
        return " <a href='#{employees_url(act.employee.id)}'> 自分のGallery </a> に".html_safe
      end
    end
    ""
  end

  def put_glyphicon(act)
    case act.action_type
    when "upload_photo"
      "<span class='glyphicon glyphicon-cloud-upload' style='color: #bbb;'></span>".html_safe
    when "like_photo"
      "<span class='glyphicon glyphicon-heart' style='color: #bbb;'></span>".html_safe
    when "poke_employee"
      "<span class='glyphicon glyphicon-star' style='color: #bbb;'></span>".html_safe
    when "create_board"
      "<span class='glyphicon glyphicon-paste' style='color: #bbb;'></span>".html_safe
    else
      "".html_safe
    end
  end
  
end
