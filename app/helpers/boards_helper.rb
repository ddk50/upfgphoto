# -*- coding: utf-8 -*-

module BoardsHelper

  class Dir
    attr_accessor :name
    def initialize(name)
      @name = name
    end

    def eql?(other)
      if other.class == Dir
        return @name == other.name
      end
      false
    end

    def hash
      @name.hash
    end
  end

  class Album
    attr_accessor :value, :name
    def initialize(name, value)
      @name = name
      @value = value
    end
  end

  def subscribed?(board)
    board.employees.any?{|employee| employee.id == current_employee.id}
  end

  def board_permission_badge(m, board)
    if board.guest
      m.span({:class => "badge alert-danger", :style => "margin-left: 10px;"}, "ゲストアルバム")
      return
    end
    if board.public
      m.span({:class => "badge alert-warning", :style => "margin-left: 10px;"}, "Publicアルバム")
      return
    end

    if board.specialized || subscribed?(board)
      m.span({:class => "badge alert-success", :style => "margin-left: 10px;"}, "購読済み")
      return
    end
    m.span({:class => "badge alert-info", :style => "margin-left: 10px;"}, "未購読")
  end

  def gsub_http_to_https(url)
    url.gsub(/http:\/\//, 'https://')
  end

  def insert_tree(hash, splited_title, value)
    return if splited_title.size <= 0

    new_node = splited_title.first
    val = hash[Dir.new(new_node)]

    if not val.nil?
      insert_tree(val, splited_title.drop(1), value)
    else
      name = splited_title.drop(1)
      if name.size <= 0
        hash[Album.new(new_node, value)] = {}
      else
        hash[Dir.new(new_node)] = {}
      end
      insert_tree(hash[Dir.new(new_node)], splited_title.drop(1), value)
    end
  end

  def markup
    root = Nokogiri::HTML::DocumentFragment.parse('')
    Nokogiri::HTML::Builder.with(root) do |doc|
      yield(doc)
    end
    root.to_html.html_safe
  end

  def do_build_html_tree(m, hash, top_level = true)
    attr = top_level ? {:class => "board-nav board-nav-list"} : {:class => "board-nav board-nav-list tree"}
    m.ul(attr) do
      hash.each_pair{|key, val|
        if key.kind_of?(Dir)
          m.li do
            m.span({:class => "tree-toggler glyphicon glyphicon-minus", :style => "color: #999999;"})
            m.label({:class => "board-nav-header"}, key.name)
            do_build_html_tree(m, val, false)
          end
        elsif key.kind_of?(Album)
          m.li({:class => "board-caption"}) do
            m.div({:class => "wrapper"}) do

              ##              m.span({:class => "glyphicon glyphicon-chevron-right", :style => "margin-right: 5px; color: #999999;"})

              m.a({:href => boards_show_url(key.value.id)})  do
                m.img({:src => "/images/folder.png", :width => "30px", :height => "30px", :style => "margin-right: 10px;"})
              end
              m.a({:href => boards_show_url(key.value.id), :class => "caption-link"}, "#{key.name} (#{key.value.photo_size})")

              board_permission_badge(m, key.value)

              if subscribed?(key.value) && (not key.value.public) && (not key.value.guest)
                m.div({:class => "pull-right"}) do
                  m.a({:class => "caption-link", :href => board_admin_url(key.value.id)}) do
                    m.span({:class => "glyphicon glyphicon-cog"}, "ユーザ管理")
                  end
                end
              end

              m.div({:class => "mic-info"}, "By: ") do
                m.a({:class => "caption-link", :href => employees_url(key.value.employee.id)}, key.value.employee.name)
                m.print " on #{key.value.created_at.strftime("%Y-%m-%d")}"
              end

              m.div({:class => "comment-text"}) do
                m.print key.value.description
              end

            end
          end
        end
      }
    end
  end

  def build_html_tree(hash)
    ##
    ## 新しくhashが出てきた時は<ul>を追記する
    ##
    ## それ以外は全て<li>
    ##
    markup do |m|
      do_build_html_tree(m, hash)
    end
  end

end
