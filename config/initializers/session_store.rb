# Be sure to restart your server when you modify this file.

##Rails.application.config.session_store :cookie_store, key: '_upfgphoto_session'
Rails.application.config.session_store ActionDispatch::Session::CacheStore, key: '_upfgphoto_session', expire_after: 1.month

