module Api
  module V1
    class StorageController < BaseController
      before_action :require_approved

      def show
        render json: {
          total_bytes: ENV.fetch("STORAGE_QUOTA_BYTES", 500.gigabytes).to_i,
          used_bytes: ActiveStorage::Blob.sum(:byte_size)
        }
      end
    end
  end
end
