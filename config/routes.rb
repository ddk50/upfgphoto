Rails.application.routes.draw do
  # get 'photo/index'

  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  # root 'welcome#index'

  root :to => 'photo#index'

  get 'employees/index'
  get 'employees/:id' => 'employees#show', as: :employees
##  get 'employees/:id/:page' => 'employees#show', as: :employees_page

  get '/auth/:provider/callback' => 'sessions#create'
  get '/logout' => 'sessions#destroy', as: :logout

  post 'photo' => 'photo#upload'
  post 'photo_jpg' => 'photo#uploadjpg', as: :photo_upload_jpg
  get 'photo/:id' => 'photo#show', as: :photo_show
  get 'photo/:id/thumbnail' => 'photo#thumbnail', as: :photo_thumbnail
  delete 'photo/:id' => 'photo#delete', as: :photo_delete
  get 'photo/:id/view' => 'photo#view', as: :photo_view
  get 'photo/:id/download' => 'photo#download', as: :photo_download

  post 'photo/delete/multiple' => 'photo#delete_multiple_items'
  get 'photo/download/multiple' => 'photo#get_multiple_items'
  get 'photo/download/zip/:fname' => 'photo#get_zip', as: :zip_download
  
  get 'tags' => 'tags#gettags'
  get 'hottags' => 'tags#hottags'
  post 'edittags' => 'tags#edittags'

  get 'tags/:tag' => 'tags#show', as: :tagphoto
  get 'tags/:tag/:page' => 'tags#show', as: :tagphoto_page
  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end

  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
