# -*- coding: utf-8 -*-
# ワーカーの数
worker_processes 4

# ソケット
listen  '/tmp/unicorn.sock'
pid     '/tmp/unicorn.pid'

# ログ
log = '${my_app}/log/unicorn.log'
stderr_path File.expand_path('log/unicorn.log', ENV['RAILS_ROOT'])
stdout_path File.expand_path('log/unicorn.log', ENV['RAILS_ROOT'])

preload_app true
GC.respond_to?(:copy_on_write_friendly=) and GC.copy_on_write_friendly = true

before_fork do |server, worker|
  defined?(ActiveRecord::Base) and ActiveRecord::Base.connection.disconnect!

  old_pid = "#{ server.config[:pid] }.oldbin"
  unless old_pid == server.pid
    begin
      sig = (worker.nr + 1) >= server.worker_processes ? :QUIT : :TTOU
      Process.kill :QUIT, File.read(old_pid).to_i
    rescue Errno::ENOENT, Errno::ESRCH
    end
  end
end

after_fork do |server, worker|
  defined?(ActiveRecord::Base) and ActiveRecord::Base.establish_connection
end

# for passenger
if defined?(PhusionPassenger)
  PhusionPassenger.on_event(:starting_worker_process) do |forked|
    Rails.cache.reset if forked
    ObjectSpace.each_object(ActionDispatch::Session::DalliStore) { |obj| obj.reset }
  end
end

# for unicorn
after_fork do |server, worker|
  if defined?(ActiveSupport::Cache::DalliStore) && Rails.cache.is_a?(ActiveSupport::Cache::DalliStore)
    Rails.cache.reset
    ObjectSpace.each_object(ActionDispatch::Session::DalliStore) { |obj| obj.reset }
  end
end
