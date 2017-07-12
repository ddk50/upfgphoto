# -*- coding: utf-8 -*-
module Comiketsub
  extend ActiveSupport::Concern
  included do
    ##
    ## outputpathに変換済みのcsvファイルを出力する
    ##
    def export_csv(outputpath, list)
      intro_csv = CSV.generate do |csv|
        ## ヘッダーを書き込む
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
        
        list.each do |e|
          intro_msg = [
                       e.date.encode("Shift_JIS", :undef => :replace),
                       e.chiku.encode("Shift_JIS", :undef => :replace),
                       e.space.encode("Shift_JIS", :undef => :replace),
                       e.shima.encode("Shift_JIS", :undef => :replace),
                       e.circle_name.encode("Shift_JIS", :undef => :replace),
                       e.zokusei.encode("Shift_JIS", :undef => :replace),
                       e.item.encode("Shift_JIS", :undef => :replace),
                       e.tanka,
                       e.hattyusu,
                       current_employee.nickname,
                       e.bikou.encode("Shift_JIS", :undef => :replace),
                       e.point
                      ]
          csv_arry << intro_msg
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
  end


  WEEK = {
    "月".encode("Shift_JIS") => 0, 
    "火".encode("Shift_JIS") => 1, 
    "水".encode("Shift_JIS") => 2, 
    "木".encode("Shift_JIS") => 3, 
    "金".encode("Shift_JIS") => 4, 
    "土".encode("Shift_JIS") => 5, 
    "日".encode("Shift_JIS") => 6
  }
  
  def do_record_csv(filepath, encode, targetcolor)
    open(filepath, "r:#{encode}", undef: :replace, invalid: :replace) do |f|
      ActiveRecord::Base.transaction do
        Comiket.where(employee_id: current_employee.id).delete_all()
        CSV.new(f).each do |row|         
          if row[0] =~ /Circle/
            next if row[2].to_s != targetcolor.to_s
            begin 
              date        = sanitize_date(row[5]).encode("Shift_JIS")
              space       = concat_spacenum(row[6], row[8], row[7], row[21]).encode("Shift_JIS", :undef => :replace)
              _attribute  = get_attribute(row[5], row[6], row[7], row[8]) ## 属性
              chiku       = get_chiku(row[6], row[7]).encode("Shift_JIS", :undef => :replace) ## 地区
              space       = (date == "欠席") ? "欠席".encode("Shift_JIS") : space
              shima       = get_shima(row[6], row[7]).encode("Shift_JIS", :undef => :replace) ## 島
              circle_name = sanitize_circlename(row[10]).encode("Shift_JIS", :undef => :replace)
              zokusei     = _attribute.encode("Shift_JIS", :undef => :replace) ## 属性
              item        = "新刊".encode("Shift_JIS", :undef => :replace)
              tanka       = "".encode("Shift_JIS", :undef => :replace)
              hattyusu    = "1".encode("Shift_JIS")
              bikou       = "".encode("Shift_JIS", :undef => :replace)
              point       = get_point(_attribute).to_s.encode("Shift_JIS", :undef => :replace) ## ポイント
              
              ## データベースに突っ込む
              newent = Comiket.new(employee_id: current_employee.id, 
                                   date: date,
                                   chiku: chiku,
                                   space: space,
                                   shima: shima,
                                   circle_name: circle_name,
                                   zokusei: zokusei,
                                   item: item,
                                   tanka: tanka,
                                   hattyusu: hattyusu,
                                   hattyusha: current_employee.nickname,
                                   bikou: bikou,
                                   point: point)

              newent.save!
            rescue ComiketDefeatCircleDetected => e
              next
            end
          end
        end            
      end     
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
