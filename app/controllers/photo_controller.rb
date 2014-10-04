# -*- coding: utf-8 -*-
class PhotoController < ApplicationController
  
  def index
    @employees = Employee.all    
  end

  def upload
    f = params[:target_file]
    @original_filename = f.original_filename    # ファイル名
    @content_type = f.content_type                # Content-Type
    @size = f.size                               # ファイルサイズ
    @read = f.read                               # ファイルの内容

    ##
    ## File.open(Rails.root + '/tmp/files/' + @original_filename, 'wb') do |f|
    ##
    
    tmppath = '/tmp/files/' + SecureRandom.uuid.to_s
    FileUtils.mkdir_p(tmppath) unless FileTest.exist?(tmppath)

    tmpfullpath = tmppath + "/" + @original_filename

    File.open(tmpfullpath, 'wb') do |f|
      f.write(@read)
    end

    extract(tmpfullpath, tmppath)

    redirect_to root_path, notice: 'アップロード完了'
  end
  
  private
  #output_path:: 展開先ディレクトリ 
  def extract(src_path, output_path)
    output_path = (output_path + "/").sub("//", "/")
    Zip::ZipInputStream.open(src_path) do |s|
      while f = s.get_next_entry()
        d = File.dirname(f.name)
        FileUtils.makedirs(output_path + d)
        f =  output_path + f.name
        unless f.match(/\/$/)
          p f
          File.open(f, "w+b") do |wf|
            wf.puts(s.read())
          end
        end
      end
    end
  end
  
end
