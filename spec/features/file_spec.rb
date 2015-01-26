# -*- coding: utf-8 -*-

require 'spec_helper'

describe 'ユーザが写真の登録を行うために，ログインをする' do
  
  context 'トップページに遷移し，"twitterでログイン"をクリックしたとき' do
    context 'かつTwitterでのログインに成功した時' do
      before do
        visit root_path
        click_link 'Twitterでログイン'
      end

      it 'アップロードが成功するはず' do
        filepath = 'spec/factories/red.zip'
        visit root_path

        Capybara.ignore_hidden_elements = false
        
        attach_file 'target_file_zip', 'spec/factories/red.zip'        
        click_button 'ZIPを送信'
        expect(page.current_path).to eq(root_path)
        within('div.alert.alert-success') do 
          expect(page).to have_content 'アップロード完了 4個のファイルを追加'
        end
        Capybara.ignore_hidden_elements = true
      end
      
    end
  end
end

