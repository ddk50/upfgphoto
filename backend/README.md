# uprun backend

写真共有サービス **uprun**（旧 upfgphoto のフルリプレイス）の API サーバ。
SPA（`../frontend`）へ JSON を返し、本番では React ビルドと共有リンクの OGP HTML も配信する。

設計判断はすべて [`../docs/ADR.md`](../docs/ADR.md)、本番切替手順は
[`../docs/MIGRATION.md`](../docs/MIGRATION.md)、API 仕様は [`../docs/API.md`](../docs/API.md) を参照。

## スタック

- **Ruby 4.0.1**（rbenv） / **Rails 8.1**
- **MySQL 8**（adapter: `trilogy`）。開発・テスト・ステージング・本番すべて MySQL に統一（ADR-021）
- **ActiveStorage**（Disk サービス）で写真原本と variant を保存
- 認証: Google OAuth（`omniauth-google-oauth2`）。session cookie ベース、書き込みは CSRF 検証
- 静的配信/圧縮は **Thruster**（`bin/thrust`）、型検査は **rbs-inline + Steep**（ADR-024）

## セットアップ（ローカル開発）

前提: rbenv で Ruby 4.0.1、Docker（MySQL 用）。

```bash
# 1. MySQL 8.4 を起動（uprun_development / _test / _staging を自動作成）
docker compose up -d

# 2. 依存と DB スキーマ
bundle install
bin/rails db:prepare

# 3. 旧 upfgphoto から開発データを投入（任意・ETL は冪等）
bin/rails etl:import      # 既定の LEGACY_DB / LEGACY_DATA を読む（下記）

# 4. サーバ起動（:3000）
bin/rails server
```

フロントは別ターミナルで `cd ../frontend && npm run dev`（`:5173`、`/api` 等を `:3000` へプロキシ）。

### ステージング構成をローカルで動かす（本番と同一構成の確認）

```bash
RAILS_ENV=staging SECRET_KEY_BASE=<任意> bin/rails db:prepare etl:import
```

### ログイン（開発）

開発環境のみ **dev ログインのバックドア**が有効（`POST /dev/login`、`{ user_id }`）。
フロントのログイン画面「開発用ログイン」に user id を入れる（例: `1` = admin）。
production 以外では該当ルートが 404（env 誤設定だけがこれを破る点に注意）。

## 環境変数

| 変数 | 用途 | 既定 |
|---|---|---|
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` | MySQL 接続 | `127.0.0.1` / `3306` / `uprun` / — |
| `DB_NAME` | staging/production の DB 名 | `uprun_staging` / `uprun_production` |
| `SECRET_KEY_BASE` | セッション署名（本番必須） | — |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth | — |
| `STORAGE_ROOT` | ActiveStorage の保存先（本番は大容量ディスク） | `storage/`（本番） |
| `MAX_UPLOAD_MB` | 1枚あたりのアップロード上限 | 50 |
| `TRASH_RETENTION_DAYS` | ゴミ箱の保持日数（ADR-022） | 30 |

## テスト・静的検査

```bash
bin/check         # rubocop + 型検査 + rspec を一括（CI 相当）
bundle exec rspec # テストのみ
bin/typecheck     # rbs-inline で sig 生成 → Steep（ADR-024）
bundle exec rubocop
```

RSpec は実 DB（MySQL）込みで走る（ADR-021: SQLite/mock では照合順序・SQL 方言の本番バグを検出できない）。
アクセス制御は `spec/models/effective_access_resolver_spec.rb` と `spec/models/access_policy_spec.rb`、
写真実体の認可（ADR-026）は `spec/requests/api_photo_images_spec.rb` が実行可能仕様。

## rake タスク

```bash
# 旧 upfgphoto からの一括移行（冪等: wipe → 全再構築）。詳細は MIGRATION.md §3
#   LEGACY_DB   旧 production.sqlite3 のパス
#   LEGACY_DATA 写真原本ディレクトリ
#   SKIP_FILES=1 で DB のみ（画像 attach を省略）
#   本番実行は FORCE=1 必須（誤爆ガード）
bin/rails etl:import
bin/rails etl:attach          # 画像取り込みのみ再開（DB は wipe しない）

# ゴミ箱の完全削除（保持期間超過分）。本番/ステージングは日次 cron に登録（ADR-022）
bin/rails trash:purge

# ブートストラップ: pending の Google identity を既存ユーザへ紐付け（ADR-020）
#   最初の admin は自分を承認できないため初回移行時に使う
PENDING_ID=<id> TARGET_ID=<id> bin/rails admin:link_google
```

## デプロイ

本番は **Rails 単一コンテナ**（`../Dockerfile` + `../compose.production.yaml`、ADR-025）。
React ビルドは image に焼き込み、SPA catch-all（`SpaController`）と共有リンク OGP（`SharePagesController`）も
Rails が配信する。MySQL はコンテナ外、写真は `STORAGE_ROOT` のボリューム。手順は
[`../docs/MIGRATION.md`](../docs/MIGRATION.md) を参照。
