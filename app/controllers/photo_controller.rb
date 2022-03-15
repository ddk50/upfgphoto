# -*- coding: utf-8 -*-

## DOWNLOAD_TMP_PATH = '/tmp/files'
## SPOOL_DIR         = '/mnt/upfgphotos'
## PHOTO_RESIE_RATE  = 0.1

class PhotoController < ApplicationController

  before_action :authenticate_user!, except: :index
  before_action :authenticate_guest!, except: [:index, :show, :view, :thumbnail, :edit, :delete, :delete_multiple_items, :get_zip, :get_multiple_items, :editdescription, :editcaption, :editpanel]

  def index
    @recent_photos = Photo.select("photos.id, count(activities.target_photo_id) as count")
      .joins(:activities)
      .group("activities.target_photo_id")
      .where(activities: {action_type: Activity.action_types[:like_photo]})
      .order('count DESC')
      .limit(50)
  end

  def editpanel
    id = current_employee.id
    page = params[:page] == nil ? 0 : params[:page].to_i
    perpage = params[:perpage] == nil ? PHOTO_CONFIG['page_window_size'] : params[:perpage].to_i
    
    @photos = Photo.default_includes().employee_photo(id)
      .like_tag(params[:tag])
      .between_date(params[:start], params[:end])
      .photo_order(params[:sort])
      .page(page).per(perpage)

    @employee = Employee.find_by_id(id)
  end

  def view
    @photoid    = params[:id].to_i
    @photo      = Photo.find_by_id(@photoid)

    if @photo == nil
      redirect_back fallback_location: root_path, alert: "この写真は存在しません"
      return
    end

    @holder     = @photo.employee
    @holdername = @photo.employee.nickname
  end
  
  def show
    
    photoid = params[:id]
    photo = Photo.find_by_id(photoid)

    if photo.nil?
      redirect_back fallback_location: root_path, alert: "この写真は存在しません"
      return
    end

    if authenticate_photo?(photo)
      send_file(
                "#{PHOTO_CONFIG['spool_dir']}/#{photoid}.jpg",
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
      redirect_back fallback_location: root_path, alert: "他人の写真は変更できません"
      return
    else

      begin
        photo.caption     = caption
        photo.description = description
        photo.save!
        redirect_back fallback_location: root_path, notice: "変更完了"
      rescue => e      
        redirect_back fallback_location: root_path, alert: e.to_s
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

    send_file(
              thumbnail_path,
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
        redirect_back fallback_location: root_path, alert: "他人の写真は削除できません"
      else
        photo.destroy
        destroyed = true
        redirect_back fallback_location: root_path, notice: "写真#{photoid}を削除"
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
        format.html { redirect_back fallback_location: root_path, notice: msg }
        format.json { 
          render :json => 
          {:result   => 'error',  
            :redirect => employees_url(current_employee.id),
            :msg      => msg }
        }
      end
    else
      respond_to do |format|
        format.html { redirect_back fallback_location: root_path, notice: "#{deleted_photoids.size}個の写真を削除" }
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
      send_file(zipfile_fullpath,
                :type => 'application/zip', 
                :filename => File.basename(zipfile_fullpath))
    ensure
##      File.delete(zipfile_fullpath) if File.exist?(zipfile_fullpath)
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
    ## 貴方がスーパーバイザーだったら問答無用で全て公開する
    ## 
    if current_employee.supervisor? ||
        current_employee.supervisor_and_boardmember?
      return true
    end    

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
    ## この写真はアルバムに所属してない．したがってアクセスコントロールの必要なし．見せても良い
    ##
    if photo.board.nil?
      return true
    end

    ##
    ## この写真はアルバムに所属しており，アルバムはパブリックであるか．アルバムメンバーに貴方は
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
  
end

