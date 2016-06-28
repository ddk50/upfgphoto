# -*- coding: utf-8 -*-

class ComiketCsvController < ApplicationController

  before_action :authenticate_user!
  
  def index
  end
  
  def upload
    csvfile = params[:target_comiket_csvfile]   

    begin 
      
      raise InvalidFieldFormat, "CSVファイルを指定してください" if not csvfile.present?

      tmppath = "/tmp/#{SecureRandom.uuid.to_s}.csv" 

      case checkfiletype(csvfile.path)
      when /\stext,/
        convert_csv(csvfile.path, tmppath)
      else
        raise InvalidFileFormat, "アップロードされたファイルはCSVファイルではありません"
      end

      redirect_to comiketcsv_download_path(path: File.basename(tmppath))    
    rescue InvalidFieldFormat => e
      redirect_to :back, alert: "#{e}"
    rescue InvalidFileFormat => e
      redirect_to :back, alert: "#{e}"
    rescue => e
      redirect_to :back, alert: "Error #{e}"
    end
  end

  
  def download
    csvfilepath = params[:path]
    
    if not csvfilepath.present?
      redirect_to :back, alert: "無効なPATHです"
      return      
    end

    path = "/tmp/#{csvfilepath}"

    if not FileTest.exist?(path)
      redirect_to comiketcsv_index_path(), alert: "ファイルが存在しません"
      return
    end
    send_file(path)    
  end

  private
  def convert_csv(filepath, tmpfilepath)
    intro_csv = CSV.generate do |csv|
      CSV.foreach(filepath, headers: true, encoding: "Shift_JIS:UTF-8") do |row|
        intro_msg = [
                     row[5].encode("Shift_JIS"),
                     row[6].encode("Shift_JIS"),
                     row[7].encode("Shift_JIS"),
                     row[8].encode("Shift_JIS"),
                     row[10].encode("Shift_JIS"),
                     row[12].nil? ? "".encode("Shift_JIS") : row[12].encode("Shift_JIS"),
                     row[21].encode("Shift_JIS")
                    ]
        csv << intro_msg
      end
    end

    File.open(tmpfilepath, 'w:shift_jis') do |file|
      file.write(intro_csv)
    end    
  end
  
end
