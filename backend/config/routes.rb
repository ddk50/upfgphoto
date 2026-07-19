Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # 認証 (Google OAuth のみ)。エントリは omniauth middleware の POST /auth/google_oauth2
  get "/auth/:provider/callback", to: "sessions#create"
  get "/auth/failure", to: "sessions#failure"
  delete "/logout", to: "sessions#destroy"
  post "/dev/login", to: "sessions#dev_login" if Rails.env.development?

  namespace :api do
    namespace :v1 do
      get "me", to: "me#show"

      get "folders", to: "folders#show"
      resources :photos, only: %i[show create destroy]
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
      get "folder_tree", to: "folder_tree#show"

      # ゲスト (認証不要, ADR-008/009)
      scope "g/:token", module: :guest, as: :guest do
        get "", to: "folders#show"
        post "photos", to: "photos#create"
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
end
