# -*- coding: utf-8 -*-

require 'spec_helper'

describe 'ユーザが写真の登録を行うために，ログインをする 1' do
  context 'トップページに遷移し，"twitterでログイン"をクリックしたとき' do
    context '不正なユーザがログインして来た時' do
      before do
        OmniAuth.config.mock_auth[:twitter] = OmniAuth::AuthHash.new({
          provider: 'twitter',
          uid:      '12346',
          info: {
             nickname: 'personanongrata',
             image:    'http://example.com/personanongrata.jpg'
           }
        })
        visit root_path
        click_link 'Sign in with Twitter'
      end

      it 'ログインが失敗すること' do
        expect(page.current_path).to eq(root_path)
        within('div.alert.alert-danger') do 
          expect(page).to have_content 'メンバーではありません．管理人に連絡して追加してもらってください'
        end        
      end
      
    end
  end

  context 'トップページに遷移し，"twitterでログイン"をクリックしたとき' do
    context '正規のユーザがログインして来た時' do
      before do
        OmniAuth.config.mock_auth[:twitter] = OmniAuth::AuthHash.new({
          provider: 'twitter',
          uid:      '12345',
          info: {
             nickname: 'agrement',
             image:    'http://example.com/agrement.jpg'
           }
        })

        visit root_path
        click_link 'Sign in with Twitter'
      end

      it 'ログインが成功すること' do
        expect(page.current_path).to eq(root_path)
        within('div.alert.alert-success') do
          expect(page).to have_content 'ログインしました'
        end
      end
      
    end
  end
end

##
## このテストは失敗するのでcontroller側でテストすること
##
# describe 'ユーザが写真の登録を行うために，ログインをする 2' do
#   context 'トップページに遷移し，ログインができて' do
#     context '正規のユーザがログインして来た時' do
#       before do
#         OmniAuth.config.mock_auth[:twitter] = OmniAuth::AuthHash.new({
#            provider: 'twitter',
#            uid:      '12345',
#            info: {
#              nickname: 'agrement',
#              image:    'http://example.com/agrement.jpg'
#            }
#         })

#         visit root_path
#         click_link 'Twitterでログイン'
#       end

#       it 'アップロードが成功するはず' do
#         filepath = 'spec/factories/red.zip'
#         visit root_path

#         Capybara.ignore_hidden_elements = false
        
#         attach_file 'target_file_zip', filepath
#         click_button 'ZIPを送信'
        
#         expect(page.current_path).to eq(root_path)
#         save_and_open_page
        
#         within('div.alert.alert-success') do 
#           expect(page).to have_content 'アップロード完了 4個のファイルを追加'
#         end
#         Capybara.ignore_hidden_elements = true
#       end
#     end
#   end
# end

