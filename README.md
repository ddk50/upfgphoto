## README

### make `prod.envs` file into the root of project

```
TWITTER_CLIENT_ID=<your client id>
TWITTER_CLIENT_SECRET=<your client secret>
DISCORD_HOOK_URL=<your discord webhook URL>
SECRET_KEY_BASE=<bundle exec rake secret>
```

### run for production

```
$ start_prod.sh
$ docker-compose exec uprun_puma bundle exec rake db:seed
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
