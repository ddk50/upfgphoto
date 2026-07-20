module Api
  module V1
    module Guest
      # 限定リンク経由の閲覧 (認証不要)。トークンは共有ルートのみを指し、
      # サブパスは相対解決でルート外には出られない (ADR-008/009)
      class FoldersController < BaseController
        include RendersPhotos

        def show
          link = ShareLink.active.find_by!(token: params[:token])
          root = link.folder_path
          sub_segments = parse_sub(params[:sub])
          full = sub_segments.empty? ? root : "#{root}/#{sub_segments.join('/')}"

          fq = FolderQuery.new(nil, resolver: EffectiveAccessResolver::AllVisible.new)
          render json: {
            root_path: root,
            root_name: FolderPath.name(root),
            sub: sub_segments.join("/"),
            name: FolderPath.name(full),
            folders: fq.children(full).map do |c|
              grandchildren = fq.children(c.path)
              # 孫カードと親カードのカバーが同じ写真にならないよう選び直す
              sub_cover_ids = grandchildren.first(4).filter_map { |g| g.cover_photo&.id }
              cover = c.cover_photo
              if cover && sub_cover_ids.include?(cover.id)
                cover = fq.cover_photo_for(c.path, exclude_ids: sub_cover_ids)
              end
              { name: c.name, sub: (sub_segments + [ c.name ]).join("/"),
                photo_count: c.photo_count, cover_url: cover_url(cover),
                subfolder_count: grandchildren.size,
                subfolders: grandchildren.first(4).map do |g|
                  { name: g.name, sub: (sub_segments + [ c.name, g.name ]).join("/"),
                    photo_count: g.photo_count, cover_url: cover_url(g.cover_photo) }
                end }
            end,
            photos: fq.direct_photos(full).map { |p| guest_photo_json(p) }
          }
        end

        private

        def parse_sub(sub)
          segments = sub.to_s.split("/").map(&:strip).reject(&:empty?)
          raise ActiveRecord::RecordNotFound if segments.any? { |s| s == ".." }

          segments
        end

        # ゲストには内部ユーザ情報 (uploader) を出さない
        def guest_photo_json(photo)
          {
            id: photo.id,
            title: photo.title,
            description: photo.description,
            file_name: photo.file_name,
            taken_at: photo.taken_at,
            urls: photo_urls(photo)
          }
        end
      end
    end
  end
end
