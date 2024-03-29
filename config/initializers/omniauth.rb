Rails.application.config.middleware.use OmniAuth::Builder do
  provider :twitter2, ENV['TWITTER_CLIENT_ID'], ENV['TWITTER_CLIENT_SECRET'],
           callback_path: "/auth/twitter2/callback",
           scope: "tweet.read users.read"

  OmniAuth.config.on_failure =
    Proc.new { |env| OmniAuth::FailureEndpoint.new(env).redirect_to_failure }
end
