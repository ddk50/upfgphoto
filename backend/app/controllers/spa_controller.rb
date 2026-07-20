# SPA (React ビルド = public/index.html) の配信。本番でクライアントルート
# (/folders/... 等) への直リンクをフォールバックさせる (docs/MIGRATION.md §1.4)。
# /g/* は OGP 注入のため share_pages_controller が担当し、こちらには来ない
class SpaController < ActionController::Base
  def show
    html = index_html
    if html
      render html: html.html_safe, layout: false
    else
      head :not_found # dev では Vite が SPA を配るのでここは実質本番専用
    end
  end

  private

  def index_html
    path = Rails.public_path.join("index.html")
    File.read(path) if File.exist?(path)
  end
end
