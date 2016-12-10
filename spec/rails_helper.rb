# -*- coding: utf-8 -*-

require 'rubygems'
require 'spork'
require 'database_cleaner'
require 'nkf'

Spork.prefork do

  ENV["RAILS_ENV"] ||= 'test'
  require File.expand_path("../../config/environment", __FILE__)
  require 'rspec/rails'
  require 'capybara/rspec'

  Dir[Rails.root.join("spec/support/**/*.rb")].each {|f| require f}

  RSpec.configure do |config|  
    
##    config.before(:all, type: :feature) do
    config.before(:all) do
      OmniAuth.config.test_mode = true
      # OmniAuth.config.mock_auth[:twitter] = OmniAuth::AuthHash.new({
      #   provider: 'twitter',
      #   uid:      '12345',
      #   info: {
      #       nickname: 'netwillnet',
      #       image:    'http://example.com/netwillnet.jpg'
      #   }
      # })
    end

    # [ruby on rails - Rspec and named routes - Stack Overflow]
    # (http://stackoverflow.com/questions/9475857/rspec-and-named-routes)
    config.include Rails.application.routes.url_helpers
    config.include FactoryGirl::Syntax::Methods

    config.use_transactional_fixtures = false

    # If true, the base class of anonymous controllers will be inferred
    # automatically. This will be the default behavior in future versions of
    # rspec-rails.
    config.infer_base_class_for_anonymous_controllers = false

    # Capybaraのvisitがundefinedと言われたとき、Capybara::DSLを含めるようにしたらうまくいった
    config.include Capybara::DSL
    #
    #
    config.before(:all) do
      Capybara.default_selector = :css
      Capybara.javascript_driver = :webkit
    end
    config.before(:suite) do
      DatabaseCleaner.strategy = :truncation
    end

    config.before(:each) do
      DatabaseCleaner.start
    end

    config.after(:each) do
      DatabaseCleaner.clean
    end
    
  end

end

Spork.each_run do
  FactoryGirl.reload
end

