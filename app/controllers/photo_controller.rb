# -*- coding: utf-8 -*-

DOWNLOAD_TMP_PATH = '/tmp/files'
SPOOL_DIR         = '/mnt/upfgphotos'

class PhotoController < ApplicationController
  
  def index
    @employees = Employee.all    
  end
  
  def show
    photoid = params[:id]
    send_data(
              File.read("#{SPOOL_DIR}/#{photoid}.jpg"),
              type: "image/jpeg",
              filename: "#{photoid}.jpg"
              )
  end

  def upload
    f = params[:target_file]
    @original_filename = f.original_filename    # ファイル名
    @content_type = f.content_type                # Content-Type
    @size = f.size                               # ファイルサイズ
    @read = f.read                               # ファイルの内容

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
            additions << tmp
            
##            logger.debug("############## #{shotdatetime.to_datetime}")

            newphoto.filepath = tmp
            newphoto.shotdate = shotdatetime.to_datetime
            newphoto.save
          end
        }
      end
      redirect_to root_path, notice: "アップロード完了 #{additions.size}個のファイルを追加"
    rescue => e
      additions.each{|path|
        File.delete(path)
      }
      redirect_to root_path, notice: ('トランザクションエラー ' + e.to_s)
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
  
end
