# -*- coding: utf-8 -*-
require 'spec_helper'

describe 'ユーザが写真の登録を行うために，ログインをする' do
  context 'トップページに遷移し，"twitterでログイン"をクリックしたとき' do
    context 'かつTwitterでのログインに成功した時' do
      before do
        visit root_path
        click_link 'Sign in with Twitter'
      end

      it 'トップページに遷移していること' do
        expect(page.current_path).to eq root_path
      end

      it '"ログインしました"と表示されること' do
        expect(page).to have_content 'ログインしました'
      end
      
    end
  end
end

