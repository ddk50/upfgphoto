Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # 認証 (Google OAuth のみ)。エントリは omniauth middleware の POST /auth/google_oauth2
  get "/auth/:provider/callback", to: "sessions#create"
  get "/auth/failure", to: "sessions#failure"
  delete "/logout", to: "sessions#destroy"

  namespace :api do
    namespace :v1 do
      get "me", to: "me#show"

      namespace :admin do
        # Google 初回ログイン者の承認/既存ユーザへの紐付け (ADR-020 移行フロー)
        resources :pending_users, only: %i[index destroy] do
          member do
            post :approve
            post :link
          end
        end
      end
    end
  end
end
