# -*- coding: utf-8 -*-

require 'nokogiri'

module ActivitiesHelper

  def pprint_action_type(action_type, values)
    root = Nokogiri::HTML::DocumentFragment.parse('')
    Nokogiri::HTML::Builder.with(root) do |m|
      act = values.first
      case action_type
      when "poke_employee"
        m.div do
          m.print "#{values.size}人の社員にポークしています"
          m.div({:style => "margin-top: 10px;"}) do
            values.each_with_index{|val, i|
              m.a({:href => employee_profile_url(val.target_employee_id)}) do
                m.img({:src => gsub_http_to_https(val.target_employee.image_url)})
              end
            }
          end
        end
        "#{act.employee.name} さんが <a href='#{employee_profile_url(act.target_employee_id)}'>#{act.target_employee.name}</a> さんにPokeしました".html_safe
        

      when "like_photo"
        m.div do
          m.print "以下#{values.size}枚の写真をいいねと言っています"
          m.div({:style => "margin-top: 10px;"}) do
            values.each_with_index{|val, i|
              photo_thumbnail_url = photo_thumbnail_url(id: val.target_photo_id, type: 'small')
              photo_view_url = photo_view_url(val.target_photo_id)
              m.a({:href => photo_view_url, :class => ""}) do
                m.img({:src => photo_thumbnail_url})
              end
              break if i > 6
            }
          end
        end
        
      when "upload_photo"
        m.div do
          get_board_name_if_not_null(act, m)
          m.print "以下#{values.size}枚の写真をアップロードしました"
          m.div({:style => "margin-top: 10px;"}) do
            values.each_with_index{|val, i|
              photo_view_url = photo_view_url(val.target_photo_id)
              photo_thumbnail_url = photo_thumbnail_url(id: val.target_photo_id, type: 'small')
              m.a({:href => photo_view_url, :class => ""}) do
                m.img({:src => photo_thumbnail_url})
              end            
              break if i > 6
            }
          end
        end        
      when "create_board"        
        m.div do
          m.print "#{act.employee.name}さんが#{values.size}個の新しいアルバムを作成しました"
        end
      else
        m.div do
          m.print "#{action_type}"
        end
      end

    end
    return root.to_html.html_safe
  end

  def get_board_name_if_not_null(act, m)
    if act.target_photo != nil
      if act.target_photo.board != nil
        m.a({:href => boards_show_url(act.target_photo.board.id)}) do
          m.print " #{act.target_photo.board.caption} "
        end
      else
        m.a({:href => employees_url(act.employee.id)}) do
          m.print " 自分のGallery "
        end
      end
      m.print "に"
    end
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
