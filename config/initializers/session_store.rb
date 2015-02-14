# Be sure to restart your server when you modify this file.

##Rails.application.config.session_store :cookie_store, key: '_upfgphoto_session'
Rails.application.config.session_store ActionDispatch::Session::CacheStore, key: '_upfgphoto_session', expire_after: 1.month

# for passenger
# if defined?(PhusionPassenger)
#   PhusionPassenger.on_event(:starting_worker_process) do |forked|
#     Rails.cache.reset if forked
#     ObjectSpace.each_object(ActionDispatch::Session::DalliStore) { |obj| obj.reset }
#   end
# end

# # for unicorn
# after_fork do |server, worker|
#   if defined?(ActiveSupport::Cache::DalliStore) && Rails.cache.is_a?(ActiveSupport::Cache::DalliStore)
#     Rails.cache.reset
#     ObjectSpace.each_object(ActionDispatch::Session::DalliStore) { |obj| obj.reset }
#   end
# end
