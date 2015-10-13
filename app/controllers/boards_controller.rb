# -*- coding: utf-8 -*-

require 'nokogiri'
require 'kconv'

class InvalidFileFormat < StandardError; end
class InvalidFieldFormat < StandardError; end
class InvalidRequest < StandardError; end

class Dir
  attr_accessor :name
  def initialize(name)
    @name = name
  end

  def eql?(other)
    if other.class == Dir
      return @name == other.name
    end
    super eql?(other)
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

class BoardsController < ApplicationController

  include Upload

  before_action :authenticate_user!
  before_action :authenticate_guest!, except: [:index, :show, :ddupload]
  
  def index

    boards = nil
    if current_employee.guest?
      boards = Board.guestboards_with_count
    else
      boards = Board.all_with_count
    end

    tmp = boards.inject({top: [], below: []}) do |acc, val|
      unless (t = val.caption.match(/^@\[(.*)\](.*)$/)).nil?
        acc[:top] << {val: val, cls: t[1], title: t[2]}
      else
        acc[:below] << val
      end
      acc
    end

    @boards = tmp[:below]
    @tops   = tmp[:top]

    treehash = {}
    @boards.each{|board|
      insert_tree(treehash, board.caption.split("/"), board)
    }
    @html_content = build_html_tree(treehash)
  end

  def show
    board_id = params[:id].to_i
    page = params[:page] == nil ? 0 : params[:page].to_i
    perpage = params[:perpage] == nil ? PHOTO_CONFIG['page_window_size'] : params[:perpage].to_i

    @board = Board.find_by_id(board_id)

    if @board == nil
      redirect_to boards_index_url(), alert: "この掲示板は存在しません"
      return 
    end

    if not authenticate_board!(@board)
      redirect_to boards_index_url(), alert: "貴方にはこのアルバムの閲覧権限がありません．"
      return
    end
    
    rel = @board.photos.default_includes()

    @photos = rel
      .offset(page * perpage)
      .limit(perpage)
      .photo_order(params[:sort])
      .like_tag(params[:tag])

    @photo_count = rel.size
    @current_page = page
    @pages_count = (@photo_count % perpage) > 0 ?
                   ((@photo_count / perpage) + 1) :
                   @photo_count / perpage
    
  end

  def edit
    boardid = params[:id]
    caption = params[:caption]

    begin

      raise InvalidFieldFormat, "アルバム番号を指定してください" if boardid.nil?
      raise InvalidFieldFormat, "1文字以上のキャプションを入力してください" if caption.to_s.size <= 0

      board = Board.find_by_id(boardid)
      if board.nil?
        raise InvalidFieldFormat, "アルバム番号が不正です"
      end

      board.caption = caption
      board.save!

      respond_to do |format|
        format.json { render :json => 
          { :status => 'success', 
            :msg => '' }
        }
      end
    rescue ActiveRecord::RecordNotUnique
      respond_to do |format|
        format.json { render :json => 
          { :status   => 'error',
            :msg => 'アルバムのキャプションはユニークでなければなりません' }
        }      
      end
    rescue StandardError => e
      respond_to do |format|
        format.json { render :json => 
          { :status   => 'error',
            :msg => e.to_s }
        }
      end      
    end
  end

  def ddupload
    boardid = params[:id].to_i

    board = Board.find_by_id(boardid)
    if board.nil?
      return
    end

    if not authenticate_board!(board)
      redirect_to :back, alert: "ゲストはこのアルバムにアップロードはできません"
      return
    end

    if not params[:tags].nil?
      params[:tags] = params[:tags].split(",")
    end

    file = ensure_uploaded_file(params[:target_file_upload]) if params[:target_file_upload].present?
    file = ensure_uploaded_file(params[:file]) if params[:file].present?

    if file.respond_to?(:each_value)
      file.each_value do |uploadfile|        
        accept_upload_file(uploadfile, board.guest) {|newphotoid|

          ##
          ## アルバムに所属させる
          ##
          board = Board.find_by_id(boardid)
          t = Board2photo.new(photo_id: newphotoid, board_id: board.id)
          t.save!

          ##
          ## Activityを更新
          ##
          new_act = Activity.new(employee_id: current_employee.id,
                             target_photo_id: newphotoid,
                             action_type: :upload_photo)
          new_act.save!
        }
      end
    else
      uploadfile = file
      boardid = params[:id].to_i
      accept_upload_file(uploadfile, board.guest) {|newphotoid|

        ##
        ## アルバムに所属させる
        ##
        board = Board.find_by_id(boardid)
        t = Board2photo.new(photo_id: newphotoid, board_id: board.id)
        t.save!

        
        ##
        ## Activityを更新
        ##
        new_act = Activity.new(employee_id: current_employee.id,
                           target_photo_id: newphotoid,
                           action_type: :upload_photo)
        new_act.save!
      }
    end
  end

  def new
    description = params[:description]
    caption     = params[:caption]
    pub         = params[:public] ? true : false
    guest       = params[:guest] ? true : false

    begin
      ActiveRecord::Base.transaction do
        board = Board.new(employee_id: current_employee.id, ## owner!!
                          description: description,
                          public: pub,
                          guest: guest,
                          caption: caption)
        board.save!
        
        ##
        ## first member!!
        ##

        ##
        ## from: me
        ## to: me
        ## invited and accepted
        ##
        board.addnewmember(current_employee.id, current_employee.id)
      end
      
      redirect_to boards_index_url(), notice: "新たなアルバム #{caption} を作成しました"
      
    rescue => e
      redirect_to :back, alert: e.to_s
      logger.fatal "[FATAL] 例外が発生しました"
      logger.fatal e.backtrace.join("\n")
    end

  end

  def addboardpanel
  end

  def adminboard    
    board_id = params[:id].to_i

    @board = Board.find_by_id(board_id)

    if @board.public
      redirect_to boards_index_url(), alert: "Publicアルバムに閲覧権限を付与することは出来ません"
      return
    end

    if not @board.employees.any?{|employee| employee.id == current_employee.id }
      redirect_to boards_index_url(), alert: "貴方にはこのアルバムのメンバーではありません"
      return
    end

    @employees = Employee.all
  end


  def movephoto
    photos = params[:items_ids]
    boardid = params[:boardid]

    result = 'error'
    msg = ""

    begin

      unless current_employee.supervisor? or
          current_employee.supervisor_and_boardmember?
        raise InvalidRequest, "この操作は管理人にしか許可されていません"
      end

      if photos.blank? ||
          boardid.blank?
        raise InvalidFieldFormat, "1つ以上の写真を指定し，かつ，アルバムIDを指定してください"
      end

      ActiveRecord::Base.transaction do

        ##
        ## first, clean up board2photos
        ##
        t = Board2photo.where(photo_id: photos)
        t.delete_all()

        ##
        ## アルバムに所属させる
        ##        
        board = Board.find_by_id(boardid)
        photos.each do |p|
          n = Board2photo.new(photo_id: p, board_id: board.id)
          n.save!
        end
        msg = "#{photos.size}個の写真を #{board.caption} (#{board.id}) に移動しました"
        result = 'success'
      end
    rescue => e
      msg = e.to_s
    end

    respond_to do |format|
      format.html { redirect_to :back, notice: msg }
      format.json { 
        render :json => 
        {:result   => result,
          :redirect => (session[:return_to] ||= request.referer),
          :msg      => msg }
      }
    end
    
  end
  
  def update_member_auth
    board_id     = params[:id].to_i
    employee_ids = params[:employee_ids].nil? ? [] : params[:employee_ids]
    
    Board.delete_member_all_but_not_owner(board_id)

    board = Board.find_by_id(board_id)
    logger.debug("********************** #{employee_ids} ***********************")
    employee_ids.each{|id|
      board.addnewmember(current_employee.id, id)
    }

    respond_to do |format|
      format.html { redirect_to :back, notice: "購読者を変更しました" }
      format.json {
        render :json =>
        {
          :result => 'ok'
        }
      }
    end    
  end
  

  private
  def authenticate_board!(board)

    ##
    ## 貴方がスーパーユーザであった場合は見せる
    ##
    if current_employee.supervisor? ||
        current_employee.supervisor_and_boardmember?
      return true
    end

    ##
    ## ゲストモードであれば問答無用で全員に見せる
    ##
    if board.guest
      return true
    end

    ##
    ## ゲストはここまで
    ##
    if current_employee.guest?
      return false
    end


    ##
    ## アルバムがパブリックかspecializedであるのでUPFG正規職員は問答無用で見れる
    ##
    if board.public || board.specialized
      return true
    end

    ##
    ## アルバムメンバーであれば見せる
    ##
    if board.employees.any?{|employee| employee.id == current_employee.id}
      return true
    end

    ##
    ## それ以外はアルバムを見せない
    ##
    return false    
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
              
              m.a({:href => boards_show_url(key.value.photo_size)})  do
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
    ret = markup do |m|
      do_build_html_tree(m, hash)
      if not current_employee.guest?
        m.div({:style => "text-align: center; margin-top: 50px;"}) do
          m.a({:href => board_addboardpanel_url, :class => "btn btn-success btn-sm btn-block", :role => "button"}) do
            m.span({:class => "glyphicon glyphicon-new-window"})
            m.print " 新しいアルバムの作成"
          end
        end
      end
    end
    return ret
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
    return
  end

  def gsub_http_to_https(url)
    url.gsub(/http:\/\//, 'https://')
  end

  private
  # Nginx upload module経由で受信した"tempfile"パラメータを参照し、
  # 手動でActionDispatch::Http::UploadedFileを作成する。
  #
  # Nginx設定をしなくても低速ながら動作するように、ifチェックを入れておく
  def ensure_uploaded_file(file_or_hash)
    if file_or_hash.is_a?(Hash) && file_or_hash[:tempfile]
      # Nginx upload module経由の場合
      file_or_hash[:tempfile] = File.new(file_or_hash[:tempfile])
      ActionDispatch::Http::UploadedFile.new(file_or_hash)
    else
      # 通常の場合
      file_or_hash
    end
  end
  
end
