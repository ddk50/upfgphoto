FROM ruby:3.1.2
RUN apt-get update -qq && \
    apt-get install -y build-essential sqlite3 libsqlite3-dev libmagickwand-dev libpq-dev nodejs

RUN gem install nkf
    
# Rails App
RUN mkdir /app
WORKDIR /app
COPY Gemfile /app/Gemfile
COPY Gemfile.lock /app/Gemfile.lock
COPY . /app
RUN bundle install

RUN mkdir -p tmp/sockets
RUN mkdir -p data/prod
RUN mkdir -p db

# Expose volumes to frontend
VOLUME /app/public
VOLUME /app/tmp
VOLUME /app/db

# Start Server
CMD bundle exec puma -C config/puma.rb -e production
