#!/bin/sh

docker-compose -f docker-compose.yml up -d
sleep 5

docker-compose exec puma bundle exec rake db:migrate
docker-compose exec puma bundle exec rails assets:precompile

docker-compose -f docker-compose.yml restart
