Rails.application.config.middleware.use OmniAuth::Builder do
  # provider :twitter,
  #   Rails.application.secrets.twitter_api_key,
  #   Rails.application.secrets.twitter_api_secret
  provider :twitter, ENV['TWITTER_API_KEY'], ENV['TWITTER_API_SECRET']
  # provider :twitter,
  #          Rails.application.credentials.dig(:twitter,:api_key),
  #          Rails.application.credentials.dig(:twitter,:api_secret

  OmniAuth.config.allowed_request_methods = [:post, :get]
end
