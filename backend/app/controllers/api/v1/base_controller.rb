module Api
  module V1
    class BaseController < ApplicationController
      # SPA からの JSON API。CSRF トークン連携は Phase 5 (フロント接続) で配線する
      # TODO(Phase 5): X-CSRF-Token ヘッダ検証に置き換える
      skip_forgery_protection
    end
  end
end
