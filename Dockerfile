# syntax=docker/dockerfile:1
# 本番イメージ (ADR-025 / docs/MIGRATION.md)
# React ビルドを Rails の public/ に焼き込み、Rails (Puma + Thruster) が
# API・SPA・共有リンク OGP をすべて配信する。TLS 終端は手前の既設 nginx リバプロ

# --- frontend: React ビルド -------------------------------------------------
FROM node:24-slim AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- base -------------------------------------------------------------------
FROM ruby:4.0.1-slim AS base
WORKDIR /app
ENV RAILS_ENV=production \
    BUNDLE_DEPLOYMENT=1 \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_WITHOUT="development test"

# --- build: gem のビルド (trilogy は C 拡張) ---------------------------------
FROM base AS build
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends build-essential git libyaml-dev libssl-dev pkg-config && \
    rm -rf /var/lib/apt/lists/*
COPY backend/Gemfile backend/Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle "${BUNDLE_PATH}"/ruby/*/cache
COPY backend/ ./

# --- runtime ----------------------------------------------------------------
FROM base
# libvips: ActiveStorage variant / curl: ヘルスチェック用
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends libvips curl && \
    rm -rf /var/lib/apt/lists/*
COPY --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=build /app /app
# React ビルドを Rails の public/ へ (share_pages / spa コントローラの前提)
COPY --from=frontend /frontend/dist/ /app/public/

RUN useradd rails --create-home --shell /usr/sbin/nologin && \
    mkdir -p /app/log /app/tmp /app/storage /data && \
    chown -R rails:rails /app/log /app/tmp /app/storage /data
USER rails

ENTRYPOINT ["/app/bin/docker-entrypoint"]

# Thruster (:80) -> Puma (:3000)。リバプロからは http://<コンテナ>:80
EXPOSE 80
CMD ["./bin/thrust", "./bin/rails", "server"]
