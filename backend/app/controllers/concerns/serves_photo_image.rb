# 認可済みの写真画像を variant 指定で配信する共通処理。
#
# ActiveStorage 素の rails_blob_path / rails_representation_path は署名付きだが
# 認証・認可を一切行わない capability URL (誰でも取得可)。restricted フォルダの
# 実体が漏れる穴になるため、アプリ側で可視性チェックを通してから実体を返す。
# 呼び出し側 (PhotoImagesController / Guest::PhotoImagesController) が認可責任を持つ。
#
# 配信は send_file (ストレージは全環境 Disk = ADR-025 前提)。
# ActiveStorage::Streaming (send_blob_stream) は使わないこと — ActionController::Live を
# 混ぜ込むため、dev のコードリロードとのデッドロックやスレッド枯渇 (サムネイルの
# 大量並列リクエスト) で Puma 全体がハングし得る既知のリスクがある。Disk 配信なら
# send_file が上位互換 (本番は Thruster の X-Sendfile 加速も効く) なので予防的に回避。
module ServesPhotoImage
  extend ActiveSupport::Concern

  VARIANTS = %w[small large original].freeze

  private

  # photo の画像を variant で送る。認可はこのメソッドの外で済ませること。
  # public_cache: 認証経路は false (private = 共有キャッシュに載せない)、
  #               トークン経路は true (トークン自体が capability)
  def send_photo_image(photo, variant, public_cache:)
    variant = "small" unless VARIANTS.include?(variant)
    blob =
      if variant == "original"
        photo.image.blob
      else
        photo.image.variant(variant.to_sym).processed.image.blob
      end
    expires_in 1.hour, public: public_cache
    send_file blob.service.path_for(blob.key),
              type: blob.content_type, disposition: "inline", filename: blob.filename.to_s
  end
end
