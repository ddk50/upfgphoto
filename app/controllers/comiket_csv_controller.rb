# -*- coding: utf-8 -*-

class ComiketDefeatCircleDetected < StandardError; end

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
      logger.fatal e.backtrace.join("\n")
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
  CODES = {
    NKF::JIS      => 'JIS',
    NKF::EUC      => 'EUC',
    NKF::SJIS     => 'SJIS',
    NKF::UTF8       => 'UTF-8',
    NKF::UTF16    => 'UTF-16',
    NKF::BINARY   => 'BINARY',
    NKF::ASCII    => 'ASCII',
    NKF::UNKNOWN  => 'UNKNOWN'
  }

  ##
  ## row[6]: 東
  ## row[8]: 36
  ## row[7]: A
  ## row[10]: サークル名
  ## row[21]: a/b
  ##
  def convert_csv(filepath, tmpfilepath)

    f = open(filepath, 'r')
    contents = f.read
    encode = CODES[NKF.guess(contents)]

    logger.debug("*********************** #{encode} ************************")

    f.close

    case encode
    when 'UTF-8'
      save_csv_as(filepath, tmpfilepath, "UTF-8")
    when 'SJIS'
      save_csv_as(filepath, tmpfilepath, "Shift_JIS")
    else
      raise InvalidFileFormat, "不明な文字コードのCSVファイルです"
    end
  end

  WEEK = {"月".encode("Shift_JIS") => 0, "火".encode("Shift_JIS") => 1, "水".encode("Shift_JIS") => 2, "木".encode("Shift_JIS") => 3, "金".encode("Shift_JIS") => 4, "土".encode("Shift_JIS") => 5, "日".encode("Shift_JIS") => 6}
  
  def save_csv_as(filepath, outputpath, encode)
    intro_csv = CSV.generate do |csv|

      csv << ["日付".encode("Shift_JIS"), 
              "地区".encode("Shift_JIS"), 
              "スペース".encode("Shift_JIS"), 
              "島".encode("Shift_JIS"),
              "サークル名".encode("Shift_JIS"), 
              "属性".encode("Shift_JIS"), 
              "アイテム".encode("Shift_JIS"), 
              "単価".encode("Shift_JIS"), 
              "発注数".encode("Shift_JIS"), 
              "発注者".encode("Shift_JIS"), 
              "備考".encode("Shift_JIS"),
              "ポイント".encode("Shift_JIS")
             ]

      csv_arry = []

      open(filepath, "r:#{encode}", undef: :replace, invalid: :replace) do |f|
        CSV.new(f).each do |row|
          if row[0] =~ /Circle/
            begin 
              date = sanitize_date(row[5])
              space = concat_spacenum(row[6], row[8], row[7], row[21]).encode("Shift_JIS", :undef => :replace)
              attribute = get_attribute(row[5], row[6], row[7], row[8]) ## 属性
              intro_msg = [
                           date.encode("Shift_JIS"),
                           get_chiku(row[6], row[7]).encode("Shift_JIS", :undef => :replace), ## 地区
                           date == "欠席" ? "欠席".encode("Shift_JIS") : space,
                           get_shima(row[6], row[7]).encode("Shift_JIS", :undef => :replace), ## 島
                           sanitize_circlename(row[10]).encode("Shift_JIS", :undef => :replace),
                           attribute.encode("Shift_JIS", :undef => :replace), ## 属性
                           "新刊".encode("Shift_JIS", :undef => :replace),
                           "".encode("Shift_JIS", :undef => :replace),
                           "1".encode("Shift_JIS"),
                           current_employee.nickname,
                           "".encode("Shift_JIS", :undef => :replace), 
                           get_point(attribute).to_s.encode("Shift_JIS", :undef => :replace) ## ポイント
                          ]
              csv_arry << intro_msg
            rescue ComiketDefeatCircleDetected => e
              next
            end
          end        
        end
      end
      
      csv_arry.sort! do |a, b|        
        r = WEEK[a[0]] <=> WEEK[b[0]]
        if r == 0
          r = a[1] <=> b[1]
        end
        if r == 0
          r = a[2] <=> b[2]
        end
        r
      end
      
      csv_arry.each{|elem|
        csv << elem
      }

    end
    File.open(outputpath, 'w:shift_jis') do |file|
      file.write(intro_csv)
    end
  end
  
  def sanitize_date(date)
    case date
    when "月"
      return date
    when "火"
      return date
    when "水"
      return date
    when "木"
      return date
    when "金"
      return date
    when "土"
      return date
    when "日"
      return date
    else
      raise ComiketDefeatCircleDetected
    end
  end
  
  def concat_spacenum(row6, row8, row7, row21)
    row6 = "" if not row6.present?
    row7 = "" if not row7.present?
    row8 = "" if not row8.present?

    row21 = "" if not row21.present?
    ab = row21 == "0" ? "a" : "b"

    num = row8.to_i
    new_num = num.to_s.rjust(2, '0')

    return row6 + row7 + new_num + ab
  end

  def sanitize_circlename(row10)
    row10 = "" if not row10.present?
    return row10
  end
end
