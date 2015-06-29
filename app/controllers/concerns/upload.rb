# -*- coding: utf-8 -*-
module Upload
  extend ActiveSupport::Concern
  
  included do
    
    ##
    ## accept upload file common routine
    ##
    def accept_upload_file(f, guest_mode = false, &additional_transaction_block)
      
      raise InvalidFieldFormat, "アップロードするファイルを指定してください" unless f
      
      @original_filename = f.original_filename # filename
      @content_type = f.content_type           # Content-Type
      @size = f.size                           # filesize
      tags = (params[:tags] == nil) ? [] : params[:tags]  # tag
      
      logger.debug("#################### UPLOAD TAGS #{tags} ####################")
      
      tmppath = PHOTO_CONFIG['download_tmp_path'] + '/' + SecureRandom.uuid.to_s
      deleteall(tmppath) if FileTest.exist?(tmppath)
      FileUtils.mkdir_p(tmppath) unless FileTest.exist?(tmppath)

      if @original_filename.present?
        @original_filename = SecureRandom.uuid.to_s
      end      

      tmpfullpath = tmppath + "/" + @original_filename

      additions = []
      
      begin

        FileUtils.mv(f.path, tmpfullpath)
        
        case checkfiletype(tmpfullpath)
        when /Zip\sarchive\sdata/        
          ## uploaded as zip
          store_zip(tmpfullpath, tmppath, tags, additions, guest_mode, &additional_transaction_block)
        when /JPEG\simage\sdata/
          ## uploaded as jpg
          store_jpg(tmpfullpath, tmppath, tags, additions, guest_mode, &additional_transaction_block)
        else
          raise InvalidFileFormat, "JPGかZIPファイル以外は指定しないでください"
        end

        respond_to do |format|
          format.html {
            redirect_to :back, notice: "アップロード完了 #{additions.size}個のファイルを追加"
          }
          format.json { render :json => 
            {:result   => 'success',  
              :msg      => "" }
          }
        end
        
      rescue => e
        additions.each{|path, id|
          File.delete(path)
        }   

        respond_to do |format|
          format.html {
            redirect_to :back, alert: ('トランザクションエラー ' + e.to_s)
          }
          format.json { render :json => 
            {:result   => 'error', 
              :msg      => e.to_s }
          }
        end
        
      ensure
        deleteall(tmppath)
      end
    end

    def store_zip(tmpfullpath, tmppath, tags, additions, guest_mode, &additional_transaction_block)
      extract(tmpfullpath, tmppath)    
      ActiveRecord::Base.transaction do
        Dir.glob(tmppath + "/*").each {|file|
          
          next if not checkfiletype(file.to_s) =~ /JPEG\simage\sdata/
          
          newphoto = Photo.new(employee_id: current_employee.id, guest: guest_mode)
          newphoto.save!
          
          spool_path = PHOTO_CONFIG['spool_dir'] + "/" + newphoto.id.to_s + ".jpg"
          
          set_and_save_photo_exif(newphoto, file.to_s)

          FileUtils.mv(file.to_s, spool_path)
          additions << [spool_path, newphoto.id]

          tags.each{|tagname|
            tagid = Tag.update_or_create_tag(tagname)
            t = Tag2photo.new(photo_id: newphoto.id, tag_id: tagid)
            t.save!
          }
          
          additional_transaction_block.call(newphoto.id) if additional_transaction_block
        }
      end ## transaction end
    end

    def store_jpg(tmpfullpath, tmppath, tags, additions, guest_mode, &additional_transaction_block)
      ActiveRecord::Base.transaction do
        
        newphoto = Photo.new(employee_id: current_employee.id, guest: guest_mode)
        newphoto.save!

        spool_path = PHOTO_CONFIG['spool_dir'] + "/" + newphoto.id.to_s + ".jpg"

        set_and_save_photo_exif(newphoto, tmpfullpath)

        tags.each{|tagname|
          tagid = Tag.update_or_create_tag(tagname)
          t = Tag2photo.new(photo_id: newphoto.id, tag_id: tagid)
          t.save!
        }

        additional_transaction_block.call(newphoto.id) if additional_transaction_block

        FileUtils.mv(tmpfullpath, spool_path)
        additions << [spool_path, newphoto.id]
      end ## transaction end
    end

    #output_path:: 展開先ディレクトリ 
    def extract(src_path, output_path)
      ##    Zip.unicode_names = true
      extract_root_dir = output_path
      Zip::File.open(src_path) do |zip_file|
        # Handle entries one by one
        zip_file.each do |entry|
          # Extract to file/directory/symlink
          entry.extract("#{extract_root_dir}/#{entry.name}")
        end
      end
    end

    def set_and_save_photo_exif(newphoto, jpgpath)
      begin
        exif = EXIFR::JPEG.new(jpgpath)
        newphoto.shotdate      = format_date_time(exif.date_time_original)
        newphoto.model         = exif.model
        newphoto.exposure_time = exif.exposure_time.to_s
        newphoto.f_number      = exif.f_number.to_f.to_s
        newphoto.focal_length  = exif.focal_length.to_i
        newphoto.focal_length_in_35mm_film = exif.focal_length_in_35mm_film.to_i
        newphoto.iso_speed_ratings = exif.iso_speed_ratings
        newphoto.update_date_time = format_date_time(exif.date_time)
      rescue EXIFR::MalformedJPEG
        newphoto.shotdate      = nil
        newphoto.model         = nil
        newphoto.exposure_time = nil
        newphoto.f_number      = nil
        newphoto.focal_length  = nil
        newphoto.focal_length_in_35mm_film = nil
        newphoto.iso_speed_ratings = nil
        newphoto.update_date_time = nil
      end
      
      newphoto.save!
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

    def checkfiletype(filepath)
      `file #{filepath}`
    end
    
  end ## included  
end
