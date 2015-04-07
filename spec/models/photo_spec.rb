# -*- coding: utf-8 -*-

require 'spec_helper'

describe Photo do
  describe '#name' do
    context '新しい写真が投稿できる' do
      let(:photo) { create(:photo) }
      
      it 'validであること' do
        photo.valid?
      end 
      
    end    
  end
end ## end Photo

describe Tag2photo do
  describe '#name' do
    context '写真にタグを貼り付ける時' do
      let(:tag2photo) { create(:tag2photo) }
      
      it 'validであること' do
        tag2photo.valid?
      end

      it '写真を消した時，タグと写真の関係が消えること' do
        photo = tag2photo.photo        
        expect { photo.destroy }.to change(Tag2photo, :count).by(-1)        
      end

      it 'タグ自身のエントリは消えないこと' do
        photo = tag2photo.photo        
        expect { photo.destroy }.to change(Tag, :count).by(0)
      end

    end
  end
end

describe Board2photo do
  describe '#name' do
    context '写真をボードに貼り付ける時' do
      let(:board2photo) { create(:board2photo) }

      it 'ボードがvalidであること' do
        board2photo.valid?
      end

      it '写真を消した時，ボードと写真の関係が消えること' do
        photo = board2photo.photo
        expect { photo.destroy }.to change(Board2photo, :count).by(-1)
      end

      it 'ボード自身は消えないこと' do
        photo = board2photo.photo
        expect { photo.destroy }.to change(Board, :count).by(0)
      end
      
    end
  end
end
