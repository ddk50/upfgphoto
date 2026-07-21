Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # 認証 (Google OAuth のみ)。エントリは omniauth middleware の POST /auth/google_oauth2
  get "/auth/:provider/callback", to: "sessions#create"
  get "/auth/failure", to: "sessions#failure"
  delete "/logout", to: "sessions#destroy"
  post "/dev/login", to: "sessions#dev_login" if Rails.env.development?

  # 共有リンクの HTML 配信 (OGP 焼き込み)。SPA 本体は本番では public/index.html
  get "/g/:token(/*sub)", to: "share_pages#show", format: false

  namespace :api do
    namespace :v1 do
      get "me", to: "me#show"

      get "folders", to: "folders#show"
      patch "folders", to: "folders#rename"
      resources :photos, only: %i[show create destroy] do
        member { get :image, to: "photo_images#show" } # 認可付き実体配信 /api/v1/photos/:id/image
      end
      get "search", to: "search#show"
      resources :tags, only: :index
      get "my_photos", to: "my_photos#index"
      get "access_rules", to: "access_rules#show"
      put "access_rules", to: "access_rules#update"
      resources :share_links, only: :index
      resources :trash, only: %i[index destroy] do
        member do
          post :restore
        end
      end
      resources :users, only: :index
      get "storage", to: "storage#show"
      get "stats", to: "stats#show"
      get "folder_tree", to: "folder_tree#show"

      # ゲスト (認証不要, ADR-008/009)
      scope "g/:token", module: :guest, as: :guest do
        get "", to: "folders#show"
        post "photos", to: "photos#create"
        # トークンスコープの実体配信 (OGP og:image もこれ)
        get "photos/:id/image", to: "photo_images#show", as: "photo_image"
      end

      namespace :admin do
        # Google 初回ログイン者の承認/既存ユーザへの紐付け (ADR-020 移行フロー)
        resources :pending_users, only: %i[index destroy] do
          member do
            post :approve
            post :link
          end
        end
        resources :users, only: %i[index update]
      end
    end
  end

  # SPA のクライアントルート直リンクを index.html にフォールバック (本番配信構成)。
  # 必ず最下部に置くこと (上の全ルートが優先)。HTML 要求 (Accept: */* 含む —
  # curl やクローラの既定) のみ対象で、/api 等は除外して JSON 404 を維持する
  root to: "spa#show"
  get "*path", to: "spa#show", format: false, constraints: ->(req) {
    format = req.format
    (format.nil? || format.html? || format.to_s == "*/*") &&
      !req.path.start_with?("/api/", "/auth/", "/rails/", "/dev/")
  }
end
