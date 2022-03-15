# -*- coding: utf-8 -*-

class ComiketDefeatCircleDetected < StandardError; end

class ComiketCsvController < ApplicationController
  before_action :authenticate_user!

  include Comiketsub
  
  def index
    @list = Comiket.where(employee_id: current_employee.id)
  end
  
  def upload
    csvfile = params[:target_comiket_csvfile]
    targetcolor = params[:targetcolor]
    begin       
      raise InvalidFieldFormat, "CSVファイルを指定してください" if not csvfile.present?

      case checkfiletype(csvfile.path)
      when /\stext,/
        convert_csv_and_record(csvfile.path, targetcolor)
      else
        raise InvalidFileFormat, "アップロードされたファイルはCSVファイルではありません"
      end      
      redirect_to comiketcsv_index_url, notice: "アップロード完了"
    rescue InvalidFieldFormat => e
      redirect_back fallback_location: root_path, alert: "#{e}"
    rescue InvalidFileFormat => e
      redirect_back fallback_location: root_path, alert: "#{e}"
    rescue CSV::MalformedCSVError
      redirect_back fallback_location: root_path, alert: "アップロードされたファイルはCSVファイルではないようです"
    rescue => e
      logger.fatal e.backtrace.join("\n")
      redirect_back fallback_location: root_path, alert: "Error #{e}"
    end
  end
  
  def download
    csvtmppath = "/tmp/#{SecureRandom.uuid.to_s}.csv"     
    list = Comiket.where(employee_id: current_employee.id)     
    export_csv(csvtmppath, list)
    send_file(csvtmppath)
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
    Encoding::WINDOWS_31J    => 'CP932', ## Windows-31J
    NKF::UNKNOWN  => 'UNKNOWN'
  }

  ##
  ## row[6]: 東
  ## row[8]: 36
  ## row[7]: A
  ## row[10]: サークル名
  ## row[21]: a/b
  ##
  def convert_csv_and_record(filepath, targetcolor)
    f = open(filepath, 'r')
    contents = f.read
    r = NKF.guess(contents)
    encode = CODES[r]
    f.close

    case encode
    when 'UTF-8'
      do_record_csv(filepath, "UTF-8", targetcolor)
    when 'SJIS'
      do_record_csv(filepath, "Shift_JIS", targetcolor)
    when 'CP932'
      ## Windows-31J CP932 はSJISとしてやっても問題ないだろう
      do_record_csv(filepath, "Shift_JIS", targetcolor)
    else
      raise InvalidFileFormat, "不明な文字コードのCSVファイルです: #{r}"
    end
  end
end

