# 認可済みの写真画像を variant 指定でストリーム配信する共通処理。
#
# ActiveStorage 素の rails_blob_path / rails_representation_path は署名付きだが
# 認証・認可を一切行わない capability URL (誰でも取得可)。restricted フォルダの
# 実体が漏れる穴になるため、アプリ側で可視性チェックを通してからバイト列を流す。
# 呼び出し側 (PhotoImagesController / Guest::PhotoImagesController) が認可責任を持つ。
module ServesPhotoImage
  extend ActiveSupport::Concern
  include ActiveStorage::Streaming # send_blob_stream (private) を取り込む

  VARIANTS = %w[small large original].freeze

  private

  # photo の画像を variant でストリームする。認可はこのメソッドの外で済ませること。
  # public_cache: 認証経路は false (private = 共有キャッシュに載せない)、
  #               トークン経路は true (トークン自体が capability)
  def stream_photo_image(photo, variant, public_cache:)
    variant = "small" unless VARIANTS.include?(variant)
    blob =
      if variant == "original"
        photo.image.blob
      else
        photo.image.variant(variant.to_sym).processed.image.blob
      end
    expires_in 1.hour, public: public_cache
    send_blob_stream(blob, disposition: "inline")
  end
end
