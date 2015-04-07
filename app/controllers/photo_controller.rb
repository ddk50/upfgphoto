# -*- coding: utf-8 -*-

## DOWNLOAD_TMP_PATH = '/tmp/files'
## SPOOL_DIR         = '/mnt/upfgphotos'
## PHOTO_RESIE_RATE  = 0.1

class InvalidFileFormat < StandardError; end
class InvalidFieldFormat < StandardError; end
class InvalidRequest < StandardError; end

class PhotoController < ApplicationController
  include Upload

  before_action :authenticate_user!, except: :index
  before_action :authenticate_guest!, except: [:index, :show, :view, :thumbnail]

  def index
    @recent_photos = Photo.select("Photos.id, count(activities.target_photo_id) as count")
      .joins(:activities)
      .group("activities.target_photo_id")
      .where(activities: {action_type: Activity.action_types[:like_photo]})
      .order('count DESC')
      .limit(40)
    
  end

  def d3cloudtags
    max_font_size = 20.0
    tags = Tag.counts
    max = tags.sort_by(&:count).last    
    freq_list = tags.map{|val|
      { key: val.name, 
        value: (val.count.to_f / max.count * (max_font_size - 1.0)).round,
        url: tagphoto_url(val.name) 
      }
    }
    
    respond_to do |format|
      format.json { render :json => 
        {:result   => 'success',
         :msg      => freq_list }
      }
    end
  end

  def uploadpanel    
  end

  def editpanel
    id = current_employee.id
    page = params[:page] == nil ? 0 : params[:page].to_i
    perpage = params[:perpage] == nil ? PHOTO_CONFIG['page_window_size'] : params[:perpage].to_i
    
    rel  = Photo.default_includes().employee_photo(id)
      .like_tag(params[:tag])
      .between_date(params[:start], params[:end])
      .photo_order(params[:sort])

    @employee = Employee.find_by_id(id)
    
    @photos = rel.offset(page * perpage).limit(perpage)

    photo_count = rel.size
    @current_page = page
    @pages_count = (photo_count % perpage) > 0 ? 
                   ((photo_count / perpage) + 1) : 
                   photo_count / perpage
    
  end

  def view
    @photoid    = params[:id].to_i
    @photo      = Photo.find_by_id(@photoid)

    if @photo == nil
      redirect_to :back, alert: "この写真は存在しません"
      return
    end

    @holder     = @photo.employee
    @holdername = @photo.employee.nickname
  end
  
  def show
    
    photoid = params[:id]
    photo = Photo.find_by_id(photoid)

    if photo.nil?
      redirect_to :back, alert: "この写真は存在しません"
      return
    end

    if authenticate_photo?(photo)
      send_data(
                File.read("#{PHOTO_CONFIG['spool_dir']}/#{photoid}.jpg"),
                type: "image/jpeg",
                filename: "#{photoid}.jpg"
                )
    else
      send_file(
                "#{Rails.root}/public/images/unauthorized.jpg",
                type: "image/jpeg",
                filename: "unauthorized.jpg"
                )
    end
    
  end

  def edit
    photoid = params[:id].to_i
    caption = params[:photocaption]
    description = params[:photodescription]
    
    photo = Photo.find_by_id(photoid)    

    if not (photo.employee_id == current_employee.id)
      redirect_to :back, alert: "他人の写真は変更できません"
      return
    else

      begin
        photo.caption     = caption
        photo.description = description
        photo.save!
        redirect_to :back, notice: "変更完了"
      rescue => e      
        redirect_to :back, alert: e.to_s
      end
      
    end
  end

  def thumbnail
    photoid = params[:id]
    type = params[:type]
    original_path = PHOTO_CONFIG['spool_dir'] + "/" + "#{photoid}.jpg"
    thumbnail_path = nil

    photo = Photo.find_by_id(photoid)

    if not authenticate_photo?(photo)
      send_file(
                "#{Rails.root}/public/images/unauthorized.jpg",
                type: "image/jpeg",
                filename: "unauthorized.jpg"
                )
      return
    end

    case type
    when 'large'
      thumbnail_path = PHOTO_CONFIG['thumbnail_large_dir'] + "/thumbnail_#{photoid}.jpg"
      gen_thumbnail(original_path, photoid, :large) if not FileTest.exist?(thumbnail_path)
    when 'small'
      thumbnail_path = PHOTO_CONFIG['thumbnail_small_dir'] + "/thumbnail_#{photoid}.jpg"
      gen_thumbnail(original_path, photoid, :small) if not FileTest.exist?(thumbnail_path)
    else
      thumbnail_path = PHOTO_CONFIG['thumbnail_small_dir'] + "/thumbnail_#{photoid}.jpg"
      gen_thumbnail(original_path, photoid, :small) if not FileTest.exist?(thumbnail_path)
    end

    send_data(
              File.read(thumbnail_path),
              type: "image/jpeg",
              filename: "thumbnail_#{photoid}.jpg"
              )    
  end

  def delete
    photoid = params[:id].to_i
    photo = Photo.find_by_id(photoid)
    destroyed = false
    
    begin
      if not (photo.employee_id == current_employee.id)
        redirect_to :back, alert: "他人の写真は削除できません"
      else
        photo.destroy
        destroyed = true
        redirect_to :back, notice: "写真#{photoid}を削除"
      end    
    ensure
      if destroyed
        delete_thumbnail(photo.id)
        delete_photo(photo.id)
      end
    end
  end


  def delete_multiple_items
    photos = params[:items_ids]
    err = false
    msg = nil
    deleted_photoids = []
    begin
      ActiveRecord::Base.transaction do
        photos.each{|id|
          p = Photo.find_by_id(id.to_i)          
          if not p.employee.id != current_employee.id
            p.destroy!
            deleted_photoids << p.id
          else
            raise InvalidRequest, "他人の写真を削除しようとしています"
          end
        }
      end
      err = false
    rescue => e
      msg = "トランザクションエラー: #{e.to_s}"
      err = true
    ensure
      if not err
        ##
        ## FIXME delete jpg files
        ##
        deleted_photoids.each{|id|
          delete_thumbnail(id)
          delete_photo(id)
        }
      end
    end

    if err
      respond_to do |format|
        format.html { redirect_to :back, notice: msg }
        format.json { 
          render :json => 
          {:result   => 'error',  
            :redirect => employees_url(current_employee.id),
            :msg      => msg }
        }
      end
    else
      respond_to do |format|
        format.html { redirect_to :back, notice: "#{deleted_photoids.size}個の写真を削除" }
        format.json { render :json => 
          {:result   => 'success',  
           :redirect => employees_url(current_employee.id),
           :msg      => msg }
        }
      end
    end   
    
  end

  def get_zip
    begin
      zipfilename = params[:fname]
      zipfile_fullpath = PHOTO_CONFIG['download_tmp_path'] + '/' + zipfilename + '.zip'
      logger.debug(sprintf("############### GET_ZIP (%s) ###############", zipfile_fullpath))
      send_data(File.read(zipfile_fullpath), 
                :type => 'application/zip', 
                :filename => File.basename(zipfile_fullpath))
    ensure
      File.delete(zipfile_fullpath) if File.exist?(zipfile_fullpath)
    end
  end

  ## 
  ## (get) download multiple items
  ##
  def get_multiple_items
    photos = params[:items_ids]

    logger.debug("############## DOWNLOAD ##################")
    
    begin      
      zip_temp_path = PHOTO_CONFIG['download_tmp_path'] + 
        '/' + SecureRandom.uuid.to_s + '.zip'      
      ret       = Photo.where(id: photos)

      if ret.size <= 0
        raise InvalidFieldFormat, "ひとつ以上のファイルを選択してください"
      end

      Zip::File.open(zip_temp_path, Zip::File::CREATE) {|zip|
        ret.each{|p|
          filepath = PHOTO_CONFIG['spool_dir'] + "/" + "#{p.id}.jpg"
          zip.add("#{p.id}.jpg", filepath)
        }
      }
      
      respond_to do |format|
        format.json { render :json => 
          {:result   => 'success',
            :redirect => zip_download_url(File.basename(zip_temp_path)),
            :msg      => "" }
        }
      end      

    rescue => e
      logger.debug("############## DOWNLOAD err #{e} ##################")
      respond_to do |format|
        format.json { render :json => 
          {:result   => 'error',  
            :redirect => employees_url(current_employee.id),
            :msg      => "エラー: #{e.to_s}" }
        }
      end
    end
  end


  ##
  ## Drag and Drop upload
  ##
  def ddupload

    if not params[:tags].nil?
      params[:tags] = params[:tags].split(",")
    end
    
    file = ensure_uploaded_file(params[:target_file_upload]) if params[:target_file_upload].present?
    file = ensure_uploaded_file(params[:file]) if params[:file].present?
    
    if file.respond_to?(:each_value)
      file.each_value do |uploadfile|
        accept_upload_file(uploadfile) {|newphotoid|
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
      accept_upload_file(uploadfile) {|newphotoid|
        new_act = Activity.new(employee_id: current_employee.id,
                               target_photo_id: newphotoid,
                               action_type: :upload_photo)
        new_act.save!        
      }
    end
  end

  ##
  ## file form upload
  ##
  def upload
    file = ensure_uploaded_file(params[:target_file_upload])
    accept_upload_file(file) {|newphotoid|
      ##
      ## Activityを更新
      ##
      new_act = Activity.new(employee_id: current_employee.id,
                         target_photo_id: newphotoid,
                         action_type: :upload_photo)
      new_act.save!
    }
  end 



  def editdescription
    photodescription = params[:photodescription]
    photoid = params[:photoid]

    begin
      raise InvalidFieldFormat, "写真番号を指定してください" if photoid == nil

      photo = Photo.find_by_id(photoid)

      if not (photo.employee_id == current_employee.id)
        raise InvalidRequest, "他人の写真の説明文は変更できません"
      end

      photo.description = photodescription
      photo.save!

      respond_to do |format|
        format.json { render :json => 
          { :status   => 'success', 
            :msg => '' }
        }
      end

    rescue => e
      respond_to do |format|
        format.json { render :json => 
          { :status   => 'error',
            :msg => e.to_s }
        }
      end      
    end
  end


  def editcaption
    photocaption = params[:photocaption]
    photoid = params[:photoid]

    begin      
      raise InvalidFieldFormat, "写真番号を指定してください" if photoid == nil
      photo = Photo.find_by_id(photoid)    

      if not (photo.employee_id == current_employee.id)
        raise InvalidRequest, "他人の写真のタイトルは変更できません"
      end

      photo.caption = photocaption
      photo.save!

      respond_to do |format|
        format.json { render :json => 
          { :status => 'success', 
            :msg => '' }
        }
      end

    rescue => e
      respond_to do |format|
        format.json { render :json => 
          { :status   => 'error',
            :msg => e.to_s }
        }
      end
    end

  end

  ##
  ## public
  ##
  public
  def gen_thumbnail(original_path, photoid, type)
    
    thumbnail_path = nil
    image = Magick::ImageList.new(original_path).first
    
    height = image.rows
    width  = image.columns
    rate   = 0.1
    
    case type
    when :small then
      if width > height
        ## 横
        rate = 400.0 / width.to_f
      else
        ## 縦        
        rate = 500.0 / height.to_f
      end     
      thumbnail_path = PHOTO_CONFIG['thumbnail_small_dir'] + "/thumbnail_#{photoid}.jpg"
    when :large then
      if width > height
        ## 横
        rate = 1024.0 / width.to_f
      else
        ## 縦        
        rate = 1024.0 / height.to_f
      end
      thumbnail_path = PHOTO_CONFIG['thumbnail_large_dir'] + "/thumbnail_#{photoid}.jpg"
    else
      return
    end

    if rate >= 1.0
      image.thumbnail(1.0).write(thumbnail_path)
    else
      image.thumbnail(rate).write(thumbnail_path)
    end
  
  end

  def delete_thumbnail(photoid)
    thumbnail_paths = [ PHOTO_CONFIG['thumbnail_large_dir'] + "/thumbnail_#{photoid}.jpg",
                        PHOTO_CONFIG['thumbnail_small_dir'] + "/thumbnail_#{photoid}.jpg" ]
        
    thumbnail_paths.each{|path|
      if FileTest.exist?(path)
        File.delete(path)
      end
    }
  end

  def delete_photo(photoid)
    File.delete(PHOTO_CONFIG['spool_dir'] + "/#{photoid}.jpg")
  end

  private
  def authenticate_photo?(photo)

    ##
    ## 写真がゲストモードであれば問答無用で公開する
    ##
    if photo.guest
      return true
    end

    ##
    ## 貴方がゲストだったらこれ以上見せてはいけない
    ##
    if current_employee.guest?
      return false
    end

    ##
    ## この写真はボードに所属してない．したがってアクセスコントロールの必要なし．見せても良い
    ##
    if photo.board.nil?
      return true
    end

    ##
    ## この写真はボードに所属しており，ボードはパブリックであるか．ボードメンバーに貴方は
    ## 入っている．したがって写真を見せても良い
    ##
    if photo.board.public || 
        photo.board.employees.any?{|employee| employee.id == current_employee.id }
      return true
    end

    ##
    ## 見せてはいけない
    ##
    return false
  end

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

