# -*- coding: utf-8 -*-

require 'rails_helper'

RSpec.describe PhotoController, :type => :controller do
  describe '写真の登録を行う' do
    
    ## include ActionDispatch::TestProcess
    ## include RSpec::Rails::ControllerExampleGroup
    
    context '' do
      before do   
##        visit root_path
##        click_link 'Twitterでログイン'
      end

      it 'アップロードが成功するはず' do
        filepath = 'spec/factories/red.zip'
        post 'upload', {
          'user' => {
            :name => 'test',
            :image => fixture_file_upload(filepath, 'application/zip'),
          }
        }
##        expect(response).to eq(redirect_to('/'))
##        expect(response.response_code).to eq(201)
##        response.response_code.should == 201
      end
    end
  end
end

