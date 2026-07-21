# 共有リンク (/g/:token) の HTML 配信。Discord 等のクローラは JS を実行しないため、
# OGP タグをサーバ側で <head> に焼き込む (ADR-008 のリンク共有をチャットで展開可能に)。
# 本番では React ビルド (public/index.html) に注入して返し、
# ビルド未配置の環境では OGP のみの最小 HTML を返す
class SharePagesController < ActionController::Base
  include RendersPhotos

  def show
    meta = og_meta
    if (index = spa_index_html)
      render html: index.sub(%r{</head>}i) { "#{meta}</head>" }.html_safe, layout: false
    else
      render html: fallback_html(meta).html_safe, layout: false
    end
  end

  private

  # 有効な共有リンクのときだけ OGP を出す。無効・失効は素の SPA (エラー表示は SPA 側)
  def og_meta
    link = ShareLink.active.find_by(token: params[:token])
    return "" unless link

    segments = params[:sub].to_s.split("/").map(&:strip).reject(&:empty?)
    return "" if segments.any? { |s| s == ".." }

    full = segments.empty? ? link.folder_path : "#{link.folder_path}/#{segments.join('/')}"
    fq = FolderQuery.new(nil, resolver: EffectiveAccessResolver::AllVisible.new)
    children = fq.children(full)
    photos = fq.direct_photos(full)
    total = photos.size + children.sum(&:photo_count)
    cover = photos.find { |p| p.image.attached? } || children.filter_map(&:cover_photo).first

    e = ->(s) { ERB::Util.html_escape(s) }
    tags = [
      %(<meta property="og:site_name" content="Uprun Photos">),
      %(<meta property="og:type" content="website">),
      %(<meta property="og:title" content="#{e.call(FolderPath.name(full))}">),
      %(<meta property="og:description" content="共有フォルダ ・ #{total} 枚の写真">),
      %(<meta property="og:url" content="#{e.call(request.original_url)}">)
    ]
    if cover && (path = cover_url(cover))
      tags << %(<meta property="og:image" content="#{e.call(request.base_url + path)}">)
      tags << %(<meta name="twitter:card" content="summary_large_image">)
    else
      tags << %(<meta name="twitter:card" content="summary">)
    end
    tags.join("\n    ")
  end

  # OGP の og:image はトークンスコープの配信口を使う (クローラは認証できない)
  def photo_image_path(photo, variant)
    api_v1_guest_photo_image_path(token: params[:token], id: photo.id, variant: variant)
  end

  def spa_index_html
    path = Rails.public_path.join("index.html")
    File.read(path) if File.exist?(path)
  end

  def fallback_html(meta)
    <<~HTML
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="utf-8">
        <title>Uprun Photos</title>
        #{meta}
      </head>
      <body>共有フォルダの表示にはフロントエンドのビルド配置が必要です。</body>
      </html>
    HTML
  end
end
