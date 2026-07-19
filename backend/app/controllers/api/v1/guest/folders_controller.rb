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
              { name: c.name, sub: (sub_segments + [ c.name ]).join("/"),
                photo_count: c.photo_count, cover_url: cover_url(c.cover_photo) }
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
