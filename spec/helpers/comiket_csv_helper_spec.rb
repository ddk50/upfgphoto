# -*- coding: utf-8 -*-
require 'rails_helper'

RSpec.describe ComiketCsvHelper, :type => :helper do
  describe "#check_tanjyoubiseki" do
    it "should get corrent attributes 1" do
      ret = check_tanjyoubiseki("土", "東", "ウ", "31")
      expect(ret).to eq("誕席")
    end

    it "should get corrent attributes 2" do
      ret = check_tanjyoubiseki("土", "東", "ソ", "45")
      expect(ret).to eq("誕席")
    end

    it "should get corrent attributes 3" do
      ret = check_tanjyoubiseki("土", "東", "ソ", "51")
      expect(ret).to eq("島中")
    end
  end

  describe "#get_attribute" do
    it "should get corrent attributes 4" do
      ret = get_attribute("土", "東", "A", "28")
      expect(ret).to eq("シャッター")

      ret = get_attribute("土", "東", "Ａ", "28")
      expect(ret).to eq("シャッター")

      ret = get_attribute("土", "東", "B", "10")
      expect(ret).to eq("島中")

      ret = get_attribute("土", "東", "シ", "70")
      expect(ret).to eq("壁")

      ret = get_attribute("土", "東", "a", "44")
      expect(ret).to eq("シャッター")

      ret = get_attribute("土", "東", "ａ", "45")
      expect(ret).to eq("シャッター")

      ret = get_attribute("土", "東", "ａ", "1")
      expect(ret).to eq("壁")

      ret = get_attribute("木", "東", "Ａ", "77")
      expect(ret).to eq("壁")

      ret = get_attribute("金", "東", "a", "31")
      expect(ret).to eq("シャッター")

      ret = get_attribute("金", "東", "a", "32")
      expect(ret).to eq("シャッター")

      ret = get_attribute("金", "東", "a", "33")
      expect(ret).to eq("シャッター")

      ret = get_attribute("金", "東", "a", "34")
      expect(ret).to eq("シャッター")
      
      ret = get_attribute("金", "東", "a", "35")
      expect(ret).to eq("シャッター")

      ret = get_attribute("金", "東", "a", "44")
      expect(ret).to eq("シャッター")

      ret = get_attribute("金", "東", "a", "45")
      expect(ret).to eq("シャッター")

      ret = get_attribute("金", "東", "a", "54")
      expect(ret).to eq("シャッター")

      ret = get_attribute("金", "東", "a", "57")
      expect(ret).to eq("シャッター")

      ret = get_attribute("金", "東", "a", "1")
      expect(ret).to eq("壁")

      ret = get_attribute("金", "東", "a", "77")
      expect(ret).to eq("壁")
    end
  end
 
  describe "#get_point" do
    it "should get point from type of circle" do
      ret = get_point("シャッター")
      expect(ret).to eq(14)

      ret = get_point("壁")
      expect(ret).to eq(8)

      ret = get_point("偽壁")
      expect(ret).to eq(5)

      ret = get_point("誕席")
      expect(ret).to eq(3)

      ret = get_point("島中")
      expect(ret).to eq(1)
    end
  end

  describe "#get_chiku" do
    it "should convert hole and shima into chiku" do
      ret = get_chiku("東", "A")
      expect(ret).to eq("東123")

      ret = get_chiku("東", "Z")
      expect(ret).to eq("東123")

      ret = get_chiku("東", "ア")
      expect(ret).to eq("東123")

      ret = get_chiku("東", "サ")
      expect(ret).to eq("東123")

      ret = get_chiku("東", "ソ")
      expect(ret).to eq("東456")

      ret = get_chiku("東", "ン")
      expect(ret).to eq("東456")

      ret = get_chiku("東", "e")
      expect(ret).to eq("東7")

      ret = get_chiku("東", "ｅ")
      expect(ret).to eq("東7")

      ret = get_chiku("東", "a")
      expect(ret).to eq("東7")

      ret = get_chiku("東", "ａ")
      expect(ret).to eq("東7")

      ret = get_chiku("西", "あ")
      expect(ret).to eq("西")
    end
  end
  
end

