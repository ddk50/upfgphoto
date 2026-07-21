module Api
  module V1
    module Guest
      # 限定リンク経由の写真実体配信 (認証不要・トークンが capability)。
      # OGP の og:image もこの経路を使う (クローラは認証できないため)。
      # 認可 = 写真が共有ルートのサブツリー内にあること (ADR-008/009)。
      class PhotoImagesController < BaseController
        include ServesPhotoImage

        def show
          link = ShareLink.active.find_by(token: params[:token])
          photo = Photo.kept.find_by(id: params[:id])
          return head :not_found unless link && photo &&
                                        within_subtree?(photo.folder_path, link.folder_path) &&
                                        photo.image.attached?

          stream_photo_image(photo, params[:variant], public_cache: true)
        end

        private

        def within_subtree?(path, root)
          path == root || path.start_with?("#{root}/")
        end
      end
    end
  end
end
