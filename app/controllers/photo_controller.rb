# -*- coding: utf-8 -*-

## DOWNLOAD_TMP_PATH = '/tmp/files'
## SPOOL_DIR         = '/mnt/upfgphotos'
## PHOTO_RESIE_RATE  = 0.1

class InvalidFileFormat < StandardError; end

class PhotoController < ApplicationController

  before_action :authenticate_user!, except: :index
  
  def index
    @employees = Employee.all
  end

  def view
    @photoid    = params[:id].to_i
    @photo      = Photo.find_by_id(@photoid)
    @holder     = @photo.employee
    @holdername = @photo.employee.nickname
    @tags       = Tag2photo.where(photo_id: @photoid)
    logger.debug(sprintf("############### GET_TAG (%s) ###############", @tags.size ))
  end
  
  def show
    photoid = params[:id]
    send_data(
              File.read("#{PHOTO_CONFIG['spool_dir']}/#{photoid}.jpg"),
              type: "image/jpeg",
              filename: "#{photoid}.jpg"
              )
  end

  def thumbnail
    photoid = params[:id]
    rate    = PHOTO_CONFIG['photo_resie_rate']
    thumbnail_path = PHOTO_CONFIG['spool_dir'] + "/thumbnail_#{photoid}.jpg"
    if not FileTest.exist?(thumbnail_path)
      image = Magick::ImageList.new("#{PHOTO_CONFIG['spool_dir']}/#{photoid}.jpg")
      image.thumbnail(rate).write(thumbnail_path)
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
        redirect_to employees_url(current_employee.id), alert: "他人の写真は削除できません"
      else
        photo.destroy
        destroyed = true
        redirect_to employees_url(current_employee.id), notice: "写真#{photoid}を削除"
      end    
    ensure
      if destroyed
        delete_thumbnail(photo.id)
        File.delete(photo.filepath)
      end
    end
  end


  def delete_multiple_items
    photos = params[:items_ids]
    err = false
    msg = nil
    reserve = 0
    deleted = 0
    deleted_photoids = []
    begin
      ActiveRecord::Base.transaction do
        photos.each{|id|
          p = Photo.find_by_id(id.to_i)          
          if not p.employee.id != current_employee.id
            p.destroy
            deleted_photoids << p.id
            deleted = deleted + 1
          else
            reserve = reserve + 1
          end
        }
      end
      if reserve > 0
        msg = "#{deleted}個のファイルを削除、#{reserve}個のファイルを保留。他人の写真を削除しようとした可能性があります"
      else
        msg = "#{deleted}個のファイルを削除"
      end
      err = false
    rescue => e
      msg = "トランザクションエラー"
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
        format.json { render :json => 
          {:result   => 'error',  
           :redirect => employees_url(current_employee.id),
           :msg      => msg }
        }
      end
    else
      respond_to do |format|
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
      logger.debug(sprintf("############### GET_ZIP (%s) ###############", zipfilename))
      send_data(File.read("/tmp/" + zipfilename), 
                :type => 'application/zip', 
                :filename => zipfilename)
    ensure
      File.delete("/tmp/" + zipfilename) if File.exist?("/tmp/" + zipfilename)
    end
  end

  ## 
  ## (get) download multiple items
  ##
  def get_multiple_items
    photos   = params[:items_ids]    

    logger.debug("############## DOWNLOAD ##################")
    
    begin      
      temp_file = Tempfile.new(["download", 'zip'])
      ret       = Photo.where(id: photos)

      if photos.size <= 0
        throw "ひとつ以上のファイルを選択してください"
      end

      Zip::ZipOutputStream.open(temp_file.path) { |zip| 
        ret.each{|p|
          zip.put_next_entry(File.basename(p.filepath))
          File.open(p.filepath, "r+b") do |file|
            zip.write(file.read())
          end
        }
      }

      zip_data = File.read(temp_file.path)

      logger.debug(sprintf("$$$$$$$$$$$ (%s -> %s -> %s) $$$$$$$$$$$$", 
                           temp_file.path,
                           File.basename(temp_file.path),
                           zip_download_url(format: :zip, 
                                            fname: File.basename(temp_file.path))))
      
      respond_to do |format|
        format.json { render :json => 
          {:result   => 'success',
            :redirect => zip_download_url(format: :zip, fname: File.basename(temp_file.path)),
            :msg      => "" }
        }
      end

    rescue => e
      logger.debug("############## DOWNLOAD err #{e} ##################")
      respond_to do |format|
        format.json { render :json => 
          {:result   => 'error',  
            :redirect => employees_url(current_employee.id),
            :msg      => "エラー: #{e}" }
        }
      end      
    ensure
      temp_file.close
    end
  end

  
  def upload
    f = params[:target_file_zip]

    if f == nil
      redirect_to root_path, alert: "アップロードするファイルを指定してください"
      return
    end

    @original_filename = f.original_filename # filename
    @content_type = f.content_type           # Content-Type
    @size = f.size                           # filesize
    @read = f.read                           # file content
    tags = (params[:tags] == nil) ? [] : params[:tags]  # tag
    
    logger.debug("#################### UPLOAD TAGS #{tags} ####################")
    
    tmppath = PHOTO_CONFIG['download_tmp_path'] + '/' + SecureRandom.uuid.to_s
    FileUtils.mkdir_p(tmppath) unless FileTest.exist?(tmppath)

    tmpfullpath = tmppath + "/" + SecureRandom.uuid.to_s + ".zip"

    File.open(tmpfullpath, 'wb') do |newfile|
      newfile.write(@read)
    end

    additions = []
    begin

      filetype = checkfiletype(tmpfullpath)
      if not filetype =~ /Zip\sarchive\sdata/
        raise InvalidFileFormat, "ZIPファイル以外は指定しないでください"
      end
      
      filenum = extract(tmpfullpath, tmppath)

      ActiveRecord::Base.transaction do
        Dir.glob(tmppath + "/*").each {|file|
          
          next if not checkfiletype(file.to_s) =~ /JPEG\simage\sdata/
          
          newphoto = Photo.new(employee_id: current_employee.id)
          newphoto.save
          
          tmp = PHOTO_CONFIG['spool_dir'] + "/" + newphoto.id.to_s + ".jpg"
          
          set_and_save_photo_exif(newphoto, file.to_s, tmp)

          FileUtils.mv(file.to_s, tmp)
          additions << [tmp, newphoto.id]

          tags.each{|tagname|
            tagid = update_or_create_tag(tagname)
            t = Tag2photo.new(photo_id: newphoto.id, tag_id: tagid)
            t.save
          }            
        }
      end ## transaction end

      redirect_to root_path, 
                 notice: "アップロード完了 #{additions.size}個のファイルを追加"
      
    rescue => e
      additions.each{|path, id|
        File.delete(path)
      }
      redirect_to root_path, 
                  alert: ('トランザクションエラー ' + e.to_s)
    ensure
      deleteall(tmppath)
    end
    
  end

  def uploadjpg
    begin 
      f = params[:target_file_jpg]
      if f == nil
        raise InvalidFileFormat, "アップロードするファイルを指定してください"
      end

      tags = (params[:tags] == nil) ? [] : params[:tags]  # tag

      tmppath = PHOTO_CONFIG['download_tmp_path'] + '/' + SecureRandom.uuid.to_s
      FileUtils.mkdir_p(tmppath) unless FileTest.exist?(tmppath)
      tmpfullpath = tmppath + "/" + SecureRandom.uuid.to_s + ".jpg"

      File.open(tmpfullpath, 'wb') do |newfile|
        newfile.write(f.read)
      end

      filetype = checkfiletype(tmpfullpath)
      logger.debug(">>>>>>>>>>>>>>>>>>>>>>>>>>> #{filetype}")
      if not filetype =~ /JPEG\simage\sdata/        
        raise InvalidFileFormat, "JPGファイル以外は指定しないでください"
      end
      
      logger.debug("#################### UPLOAD TAGS #{tags} ####################")    

      ActiveRecord::Base.transaction do
        newphoto = Photo.new(employee_id: current_employee.id)
        newphoto.save

        spool_path = PHOTO_CONFIG['spool_dir'] + "/" + newphoto.id.to_s + ".jpg"      

        set_and_save_photo_exif(newphoto, tmpfullpath, spool_path)

        tags.each{|tagname|
          tagid = update_or_create_tag(tagname)
          t = Tag2photo.new(photo_id: newphoto.id, tag_id: tagid)
          t.save
        }

        FileUtils.mv(tmpfullpath, spool_path)
      end

      redirect_to root_path, 
                  notice: "アップロード完了"
      
    rescue => e
      redirect_to root_path, 
                  alert: ('トランザクションエラー ' + e.to_s)   
    ensure
      deleteall(tmppath)      
    end
    
  end
  
  
  ##
  ## private
  ##
  private
  def set_and_save_photo_exif(newphoto, jpgpath, spool_path)
    begin
      exif = EXIFR::JPEG.new(jpgpath)
      newphoto.filepath      = spool_path
      newphoto.shotdate      = exif.date_time_original != nil ? exif.date_time_original.to_datetime : nil
      newphoto.model         = exif.model
      newphoto.exposure_time = exif.exposure_time.to_s
      newphoto.f_number      = exif.f_number.to_f.to_s
      newphoto.focal_length  = exif.focal_length.to_i
      newphoto.focal_length_in_35mm_film = exif.focal_length_in_35mm_film.to_i
      newphoto.iso_speed_ratings = exif.iso_speed_ratings
      newphoto.update_date_time = exif.date_time != nil ? exif.date_time.to_datetime : nil
    rescue EXIFR::MalformedJPEG
      newphoto.filepath      = spool_path
      newphoto.shotdate      = nil
      newphoto.model         = nil
      newphoto.exposure_time = nil
      newphoto.f_number      = nil
      newphoto.focal_length  = nil
      newphoto.focal_length_in_35mm_film = nil
      newphoto.iso_speed_ratings = nil
      newphoto.update_date_time = nil
    end
      
    newphoto.save 
  end

  #output_path:: 展開先ディレクトリ 
  def extract(src_path, output_path)
    i = 0
    output_path = (output_path + "/").sub("//", "/")
    Zip::ZipInputStream.open(src_path) do |s|
      while f = s.get_next_entry()
        d = File.dirname(f.name)
        FileUtils.makedirs(output_path + d)
        f =  output_path + f.name
        unless f.match(/\/$/)
          File.open(f, "w+b") do |wf|
            wf.puts(s.read())
          end
        end
        i = i + 1
      end
    end
  end

  # def getshottime(path)
  #   begin
  #     exif = EXIFR::JPEG.new(path)
  #     return exif.date_time_original
  #   rescue EXIFR::MalformedJPEG
  #     return nil
  #   end
  # end

  def photo_img_url(id)
    "/photo/#{id}"
  end

  def deleteall(delthem)
    if FileTest.directory?(delthem) then 
      Dir.foreach( delthem ) do |file|
        next if /^\.+$/ =~ file
        deleteall( delthem.sub(/\/+$/,"") + "/" + file )
      end
      Dir.rmdir(delthem) rescue ""
    else
      File.delete(delthem)
    end
  end

  def update_or_create_tag(tagname)
    tag = Tag.find_or_initialize_by(name: tagname);
    tag.name = tagname;
    tag.save!
    return tag.id
  end

  public
  def gen_thumbnail(original_path, photoid)
    rate    = PHOTO_CONFIG['photo_resie_rate']
    thumbnail_path = PHOTO_CONFIG['spool_dir'] + "/thumbnail_#{photoid}.jpg"
    image = Magick::ImageList.new(original_path)
    image.thumbnail(rate).write(thumbnail_path)
  end

  def delete_thumbnail(photoid)
    File.delete(PHOTO_CONFIG['spool_dir'] + "/thumbnail_#{photoid}.jpg")
  end

  def delete_photo(photoid)
    File.delete(PHOTO_CONFIG['spool_dir'] + "/#{photoid}.jpg")
  end

  def checkfiletype(filepath)
    `file #{filepath}`
  end
  
end

