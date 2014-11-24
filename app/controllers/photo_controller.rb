# -*- coding: utf-8 -*-

DOWNLOAD_TMP_PATH = '/tmp/files'
SPOOL_DIR         = '/mnt/upfgphotos'
PHOTO_RESIE_RATE  = 0.1

class PhotoController < ApplicationController
  
  def index
    @employees = Employee.all    
  end

  def view
    @photoid    = params[:id].to_i
    @photo      = Photo.find_by_id(@photoid)
    @holdername = @photo.employee.nickname    
  end
  
  def show
    photoid = params[:id]
    send_data(
              File.read("#{SPOOL_DIR}/#{photoid}.jpg"),
              type: "image/jpeg",
              filename: "#{photoid}.jpg"
              )
  end

  def thumbnail
    photoid = params[:id]
    rate    = PHOTO_RESIE_RATE
    thumbnail_path = SPOOL_DIR + "/thumbnail_#{photoid}.jpg"
    if not FileTest.exist?(thumbnail_path)
      image = Magick::ImageList.new("#{SPOOL_DIR}/#{photoid}.jpg")
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

    if not (photo.employee_id == current_employee.id)
      redirect_to employees_url(current_employee.id), notice: "他人の写真は削除できません"
    else
      delete_thumbnail(photo.id)
      File.delete(photo.filepath)
      photo.delete
      redirect_to employees_url(current_employee.id), notice: "写真#{photoid}を削除"
    end    
  end


  def delete_multiple_items
    photos = params[:items_ids]
    err = nil
    msg = nil
    begin
      ActiveRecord::Base.transaction do
        photos.each{|id|
          p = Photo.find_by_id(id.to_i)
          p.delete
        }
      end
      msg = "#{photos.size}個のファイルを削除"
    rescue => e
      msg = "トランザクションエラー"
      err = true
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
      File.delete("/tmp/" + zipfilename)
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
    f = params[:target_file]
    @original_filename = f.original_filename # ファイル名
    @content_type = f.content_type           # Content-Type
    @size = f.size                           # ファイルサイズ
    @read = f.read                           # ファイルの内容

    ##
    ## File.open(Rails.root + '/tmp/files/' + @original_filename, 'wb') do |f|
    ##
    
    tmppath = DOWNLOAD_TMP_PATH + '/' + SecureRandom.uuid.to_s
    FileUtils.mkdir_p(tmppath) unless FileTest.exist?(tmppath)

    tmpfullpath = tmppath + "/" + SecureRandom.uuid.to_s + ".zip"

    File.open(tmpfullpath, 'wb') do |f|      
      f.write(@read)
    end

    filenum = extract(tmpfullpath, tmppath)

    begin
      additions = []
      ActiveRecord::Base.transaction do
        Dir.glob(tmppath + "/*").each {|f|
          shotdatetime = getshottime(f.to_s)
          if shotdatetime                      
            
            newphoto = Photo.new(employee_id: current_employee.id)
            newphoto.save
            
            tmp = SPOOL_DIR + "/" + newphoto.id.to_s + ".jpg"
            FileUtils.mv(f.to_s, tmp)
            additions << [tmp, newphoto.id]
            
##            logger.debug("############## #{shotdatetime.to_datetime}")

            newphoto.filepath = tmp
            newphoto.shotdate = shotdatetime.to_datetime
            newphoto.save
          end
        }
      end

      additions.each{|path, id| gen_thumbnail(path, id) }

      redirect_to root_path, notice: "アップロード完了 #{additions.size}個のファイルを追加"
    rescue => e
      additions.each{|path, id|
        File.delete(path)
      }
      redirect_to root_path, notice: ('トランザクションエラー ' + e.to_s)
    ensure
      deleteall(tmppath)
    end
    
  end
  
  private
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

  def getshottime(path)
    begin
      exif = EXIFR::JPEG.new(path)
      return exif.date_time_original
    rescue EXIFR::MalformedJPEG
      return nil
    end
  end

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

  public
  def gen_thumbnail(original_path, photoid)
    rate    = PHOTO_RESIE_RATE
    thumbnail_path = SPOOL_DIR + "/thumbnail_#{photoid}.jpg"
    image = Magick::ImageList.new(original_path)
    image.thumbnail(rate).write(thumbnail_path)
  end

  def delete_thumbnail(photoid)
    File.delete(SPOOL_DIR + "/thumbnail_#{photoid}.jpg")
  end
  
end

