#!/bin/sh

docker network create --driver bridge web_network

docker-compose -f docker-compose.yml up -d
sleep 3

docker-compose exec uprun_puma bundle exec rake db:migrate
docker-compose exec uprun_puma bundle exec rails assets:precompile

docker-compose -f docker-compose.yml restart
