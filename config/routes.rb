Rails.application.routes.draw do

  get 'search/index' => 'search#index', as: :search_index

  # get 'photo/index'

  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  # root 'welcome#index'

  root :to => 'photo#index'

  get 'employees/index' => 'employees#index', as: :employees_show
  get 'employees/:id' => 'employees#show', as: :employees
  get 'employees/:id/profile' => 'employees#profile', as: :employee_profile
  get 'employees/:id/avatar' => 'employees#avatar', as: :employee_avatar
  post 'employees/:id/edit' => 'employees#edit', as: :employee_edit
##  get 'employees/:id/:page' => 'employees#show', as: :employees_page

  get '/auth/:provider/callback' => 'sessions#create'
  get '/logout' => 'sessions#destroy', as: :logout

  get 'd3cloudtags' => 'photo#d3cloudtags', as: :d3cloudtags
  
  post 'photo' => 'photo#upload', as: :photo_upload
  get 'uploadpanel' => 'photo#uploadpanel', as: :photo_panel
  get 'editpanel' => 'photo#editpanel', as: :edit_panel

  get 'photo/:id' => 'photo#show', as: :photo_show
  delete 'photo/:id' => 'photo#delete', as: :photo_delete
  post 'photo/:id' => 'photo#edit', as: :photo_edit

  get 'photo/:id/thumbnail' => 'photo#thumbnail', as: :photo_thumbnail
  get 'photo/:id/view' => 'photo#view', as: :photo_view
  get 'photo/:id/download' => 'photo#download', as: :photo_download

  post 'photo/delete/multiple' => 'photo#delete_multiple_items'
  get 'photo/download/multiple' => 'photo#get_multiple_items'
  get 'photo/download/zip/:fname' => 'photo#get_zip', as: :zip_download
  
  get 'tags' => 'tags#gettags'
  get 'hottags' => 'tags#hottags'

  get 'tags/:tag' => 'tags#show', as: :tagphoto

  post 'activities/poke/:employee_id' => 'activities#poke', as: :activities_poke
  post 'activities/viewphoto/:photo_id' => 'activities#viewphoto', as: :activities_viewphoto
  post 'activities/likephoto/:photo_id' => 'activities#likephoto', as: :activities_likephoto
  post 'activities/clearfeeds' => 'activities#clearfeeds', as: :activities_clearfeeds
  
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
