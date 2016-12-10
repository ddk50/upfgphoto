# -*- coding: utf-8 -*-
module ComiketCsvHelper
  TYPE = [["シャッター", 14],
          ["壁", 8],
          ["偽壁", 5], 
          ["誕席", 3],
          ["島中", 1]]

  def get_chiku(row6, row7)
    case row6
    when /東/
      case row7
      when /([A-Z])+|([Ａ-Ｚ])+|([ア-サ])+/
        "東123"
      when /[シ-ン]+/
        "東456"
      when /([a-z])+|([ａ-ｚ])+/
        "東7"
      else
        raise ComiketDefeatCircleDetected
      end
    when /西/
      "西"
    else
      raise ComiketDefeatCircleDetected
    end
  end
  
  def get_attribute(row5, row6, row7, row8)
    ret = do_get_attribute(row5, row6, row7, row8)
    if ret == TYPE[4].first
      return check_tanjyoubiseki(row5, row6, row7, row8)
    end
    ret
  end

  ## row5: 曜日
  ## row6: ホール
  ## row7: 島
  ## row8: スペース番号
  def do_get_attribute(row5, row6, row7, row8)
    row8 = row8.to_i
    case row6
    when /東/
      case row7        
      when /A|Ａ/
        case row8
        when 4,5,6,15,16,17,28,29,44,45,46,61,62,73,74,75,84,85,86 then          
          TYPE[0].first
        else
          TYPE[1].first
        end
      when /B|Ｂ/
        case row8
        when 1..27,39,40,52
          TYPE[4].first
        else
          TYPE[4].first
        end
      when /C|Ｃ/
        case row8 
        when 1..31,45,46,60
          if row5 =~ /金/
            TYPE[4].first
          else
            TYPE[2].first
          end
        else
          TYPE[4].first
        end
      when /H|Ｈ/
        case row8
        when 1..31,45,46,60
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /I|Ｉ/
        case row8
        when 1,15,16,30..60
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /M|Ｍ/
        case row8
        when 1..48
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /N|N/
        case row8
        when 1..48
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /T|Ｔ/
        case row8
        when 1..31,45,46,60
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /U|Ｕ/
        case row8
        when 1,15,16,30..60
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /Y|Ｙ/
        case row8
        when 1..48
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /Z|Ｚ/
        case row8
        when 1..48
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /a|ａ/
        case row8
        when 31,32,33,34,35,44,45,54,57
          TYPE[0].first
        else
          TYPE[1].first
        end
      when /キ/
        case row8
        when 1..31,45,46,60
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /ク/
        case row8
        when 1,15,16,30..60
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /サ/
        case row8
        when 1,13,14,26..52
          if row5 =~ /土/
            TYPE[4].first
          else
            TYPE[2].first
          end
        else
          TYPE[4].first
        end
      when /コ/
        case row8
        when 1,15,16,30..60
          if row5 =~ /土/
            TYPE[2].first
          else
            TYPE[4].first
          end
        else
          TYPE[4].first
        end
      when /シ/
        case row8
        when 4,5,6,15,16,17,28,29,44,45,46,61,62,73,74,75,84,85,86
          TYPE[0].first
        else
          TYPE[1].first
        end
      when /ス/
        case row8
        when 1..27,39,40,52
          if row5 =~ /土/
            TYPE[2].first
          else
            TYPE[4].first
          end
        else
          TYPE[4].first
        end
      when /セ/
        case row8
        when 1..31,45,46,60
          if row5 =~ /土/
            TYPE[2].first
          else
            TYPE[4].first
          end
        else
          TYPE[4].first
        end
      when /テ/
        case row8
        when 1..31,45,46,60
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /ト/
        case row8
        when 1,15,16,30..60
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /プ/
        case row8
        when 1..31,45,46,60
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /ヘ/
        case row8
        when 1,15,16,30..60
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /ネ/
        case row8
        when 1..48
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /ノ/
        case row8
        when 1..48
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /マ/
        case row8
        when 1..48
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /ミ/
        case row8
        when 1..48
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /ラ/
        case row8
        when 1..31,45,46,60
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /リ/
        case row8
        when 1,15,16,30..60
          TYPE[2].first
        else
          TYPE[4].first
        end
      when /ロ/
        case row8
        when 1,13,14,26..52
          if row5 =~ /土/
            TYPE[4].first
          else
            TYPE[2].first
          end
        else
          TYPE[4].first
        end
      when /レ/
        case row8
        when 1,15,16,30..60
          if row5 =~ /土/
            TYPE[2].first
          else
            TYPE[4].first
          end
        else
          TYPE[4].first
        end
      else 
        TYPE[4].first
      end
    when /西/
      case row7
      when /れ/
        case row8
        when 19,20,34,35,43,44,51,52
          TYPE[0].first
        else
          TYPE[1].first
        end
      when /あ/
        case row8
        when 19,20,34,35,43,44,51,52
          TYPE[0].first
        else
          TYPE[1].first
        end
      else
        TYPE[4].first
      end
    else
      raise ComiketDefeatCircleDetected
    end
  end

  def check_tanjyoubiseki(row5, row6, row7, row8)
    row8 = row8.to_i
    if row6 =~ /東/
      case row7
      when /([B-Z])+|([Ｂ-Ｚ])+|([ア-サ])+/
        case row8
        when 1,7,8,15,16,23,24,30,31,37,38,45,46,53,54,60
          TYPE[3].first
        else
          TYPE[4].first
        end
      when /[ス-ロ]+/
        case row8
        when 1,7,8,15,16,23,24,30,31,37,38,45,46,53,54,60
          TYPE[3].first
        else
          TYPE[4].first
        end
      else
        TYPE[4].first
      end
    else
      TYPE[4].first
    end
  end
  
  def get_shima(row6, row7)
    return row6.to_s + row7.to_s
  end

  def get_point(attribute)
    ret = TYPE.find{|elem| elem.first == attribute }
    if ret != nil      
      ret.last
    else
      nil
    end
  end
end

