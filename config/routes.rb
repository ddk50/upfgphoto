Rails.application.routes.draw do

  get 'admin/index' => 'admin#index', as: :admin_index
  post 'admin/:id/useredit' => 'admin#user_edit', as: :admin_useredit
  post 'admin/:id/authorityedit' => 'admin#authority_edit', as: :admin_authorityedit
  delete 'admin/:id' => 'admin#delete', as: :admin_delete
  post 'admin/new' => 'admin#new', as: :admin_new

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
  
  get 'editpanel' => 'photo#editpanel', as: :edit_panel
  post 'ddupload' => 'photo#ddupload', as: :ddphoto_upload

  get 'photo/:id' => 'photo#show', as: :photo_show
  delete 'photo/:id' => 'photo#delete', as: :photo_delete
  post 'photo/:id' => 'photo#edit', as: :photo_edit

  get 'photo/:id/thumbnail/:type' => 'photo#thumbnail', as: :photo_thumbnail
  get 'photo/:id/view' => 'photo#view', as: :photo_view
  get 'photo/:id/download' => 'photo#download', as: :photo_download

  post 'photo/delete/multiple' => 'photo#delete_multiple_items'
  get 'photo/download/multiple' => 'photo#get_multiple_items'
  get 'photo/download/zip/:fname' => 'photo#get_zip', as: :zip_download
  
  get 'tags' => 'tags#gettags'
  get 'hottags' => 'tags#hottags'
  post 'edittags' => 'tags#edittags'
  post 'editdescription' => 'photo#editdescription'
  post 'editcaption' => 'photo#editcaption'

  get 'tags/index' => 'tags#index', as: :tagphoto_index
  get 'tags/:tag' => 'tags#show', as: :tagphoto

  get 'activities/index' => 'activities#index', as: :activities_index
  post 'activities/poke/:employee_id' => 'activities#poke', as: :activities_poke
  post 'activities/viewphoto/:photo_id' => 'activities#viewphoto', as: :activities_viewphoto
  post 'activities/likephoto/:photo_id' => 'activities#likephoto', as: :activities_likephoto
  post 'activities/clearfeeds' => 'activities#clearfeeds', as: :activities_clearfeeds

  get 'boards/index' => 'boards#index'
  get 'boards/new' => 'boards#addboardpanel', as: :board_addboardpanel
  post 'boards/new' => 'boards#new', as: :board_new
  
  get 'boards/:id' => 'boards#show', as: :boards_show
  post 'boards/:id' => 'boards#edit', as: :boards_edit

  post 'boards/:id/admin' => 'boards#update_member_auth', as: :board_admin_post
  post 'boards/:id/ddupload' => 'boards#ddupload', as: :board_ddupload  
  get 'boards/:id/admin' => 'boards#adminboard', as: :board_admin  

  get 'search/index' => 'search#index', as: :search_index
  
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
