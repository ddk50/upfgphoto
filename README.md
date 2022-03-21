## README

### make `prod.envs` file the root of project

```
TWITTER_API_KEY=<your key>
TWITTER_API_SECRET=<your secret>
SECRET_KEY_BASE=<bundle exec rake secret>
```

### run for production

```
$ start_prod.sh
$ docker-compose exec puma bundle exec rake db:seed
```

### logs
puma log

```
$ tails -f log/production.log
```

### run for development

```
$ bunlde install
$ bundle exec rails s
```

### misc
clear docker-compose files

```
docker-compose down --rmi all --volumes --remove-orphans
```
