# 本番切替手順書（旧 upfgphoto → uprun）

旧システム（`legacy` ブランチ・Rails 7 / SQLite）から新システムへの本番移行ランブック。
上から順に実行できる形でまとめる。設計背景は ADR を参照（特に ADR-020: 移行マッピング、
ADR-021: MySQL 統一、ADR-022: ゴミ箱）。

**未確定事項は `[ ]` チェックボックスと `TBD` で残してある。決まり次第埋めること。**

---

## 0. 前提と現状

- 移行の実体は ETL（`backend/lib/etl/legacy_importer.rb`、`bin/rails etl:import`）。
  **wipe → 全再構築のべき等設計**なので、リハーサルは何度でもやり直せる
- development / staging でリハーサル済み: 件数突合 4/4 OK
  （users 128 / photos 26,684 / folders 204 / tags 557、DB 部 約8秒 + 画像 attach）
- 旧本番の入力物は2つ: `production.sqlite3`（旧DB）と `data/prod/`（写真原本 121GB）。
  いずれも gitignore 済みで**絶対にコミットしない**

## 1. 事前準備（切替日より前にいつでも可）

### 1.1 サーバ・インフラ

- [ ] 本番サーバ確保（TBD: 設置場所・スペック。ステージングの設置場所も未定 → CLAUDE.md 残タスク4）
- [ ] MySQL 8 セットアップ（8.4 推奨 = ローカル/CI と同一）。DB `uprun_production` と接続ユーザ作成
- [ ] 写真用ディスク（121GB + ゴミ箱余裕分）をマウントし、パスを `STORAGE_ROOT` に決める
- [ ] ドメイン・TLS 証明書（TBD: ドメイン名）

### 1.2 Google OAuth（CLAUDE.md 残タスク1）

- [ ] Cloud Console で OAuth クライアント作成
- [ ] 承認済みリダイレクト URI に `https://<本番ドメイン>/auth/google_oauth2/callback` を登録
  （開発用は `http://localhost:5173/auth/google_oauth2/callback`。**:3000 ではない**点に注意）
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` を控える

### 1.3 環境変数一覧

| 変数 | 用途 | 既定値 |
|---|---|---|
| `RAILS_ENV` | `production` | — |
| `SECRET_KEY_BASE` | Rails セッション署名 | 必須 |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` | MySQL 接続 | 127.0.0.1 / 3306 / uprun / — |
| `DB_NAME` | DB 名 | `uprun_production` |
| `STORAGE_ROOT` | ActiveStorage の保存先（大容量ディスク） | `backend/storage` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth | 必須 |
| `MAX_UPLOAD_MB` | 1枚あたりのアップロード上限 | 50 |
| `TRASH_RETENTION_DAYS` | ゴミ箱保持日数 | 30 |
| ETL 用: `LEGACY_DB` / `LEGACY_DATA` / `SKIP_FILES` / `FORCE` | §3 参照 | — |

### 1.4 アプリ配置（Docker、ADR-025）

配信構成は **Rails 単一コンテナ**（React ビルドはイメージに焼き込み、Thruster :80 で配信。
静的配信用 nginx は不要 — TLS 終端は手前の既設リバースプロキシ）。

- [ ] リポジトリを本番サーバへ clone
- [ ] `prod.envs.example` をコピーして `prod.envs` を作成し、§1.3 の値を埋める
- [ ] 手前のリバプロと共有する docker ネットワークを確認（なければ `docker network create web_network`）
- [ ] ビルドと起動:
  ```bash
  docker compose -f compose.production.yaml up -d --build
  ```
  起動時に `db:prepare` が自動実行される（べき等）。ヘルスチェックは `/up`
- [ ] リバプロ側に `http://uprun_app:80` へのプロキシ設定を追加（TBD: server_name 等）
- [ ] SPA 直リンク（`/folders/...`）・`/g/*` の OGP・`/api/v1/me` が返ることを確認
- [x] CSRF: `/api/v1` の書き込みは X-CSRF-Token ヘッダ検証（実装済み。フロントは api.ts の mutate() が自動付与）

### 1.5 切替前の判断事項

- [ ] **nickname 不整合5件の expires_at 手動判断**（ADR-020 実装記録・ETL レポート出力）:
  46malonu / celeron1ghz / c5vecco / MooncraftShiden / Akiba_univ
  — whitelist の expires_at が自動で引き継げないため、admin が個別に設定するか無期限のままにするか決める

## 2. 旧本番の凍結とデータ転送（切替当日）

1. 旧 upfgphoto を書き込み停止（メンテナンス表示 or プロセス停止）。
   **この時点以降の旧システムへのアップロードは移行されない**
2. 旧本番から取得:
   - `db/production.sqlite3`
   - `data/prod/`（写真原本。121GB — 事前に rsync しておき、当日は差分同期にすると停止時間が短い）
3. 新サーバの任意パス（例 `/srv/legacy/`) に配置

## 3. ETL 実行

入力物はコンテナから見えるボリューム（`./data` → `/data`）配下に置く（例 `./data/legacy/`）。

```bash
# 本番実行は FORCE=1 が必須 (誤爆ガード)
docker compose -f compose.production.yaml run --rm \
  -e FORCE=1 \
  -e LEGACY_DB=/data/legacy/production.sqlite3 \
  -e LEGACY_DATA=/data/legacy/data/prod \
  app bin/rails etl:import
```

- べき等（wipe → 再構築）なので失敗したらやり直してよい
- 画像 attach が中断した場合は `etl:attach`（DB は wipe せず未添付分のみ再開）
- レポートが `tmp/etl_report.txt` に出る。**確認必須項目**:
  - [ ] 件数突合 4/4 OK（photos / users / folders / tags）
  - [ ] `photos_with_unknown_uploader` / 板非所属写真 / 孤児 .jpg の内容が想定内
  - [ ] nickname 不整合5件 → §1.5 の判断を admin 画面で反映

## 4. 稼働設定

- [ ] ゴミ箱の日次パージをホストの cron に登録（ADR-022）:
  ```cron
  0 4 * * * cd /path/to/uprun && docker compose -f compose.production.yaml exec -T app bin/rails trash:purge >> log/trash_purge.log 2>&1
  ```
- [ ] コンテナは `restart: always`（compose）でプロセス管理
- [ ] `RAILS_ENV=production` が確実に効いていることを確認
  （dev ログインのバックドアは development 以外でルートごと 404 — spec で固定済みだが env 誤設定だけが破る）

## 5. 切替後の動作確認チェックリスト

- [ ] Google ログイン一巡: 新規 Google アカウント → pending → admin が紐付け or 承認
- [ ] 既存メンバーの紐付けフロー（ADR-020: 本人から旧 nickname を申告してもらい admin 画面で紐付け）
- [ ] フォルダ閲覧・サムネイル表示（遅延生成なので初回は生成が走る）
- [ ] 検索・タグサジェスト
- [ ] アップロード（形式検証・自動振り分け）
- [ ] 削除 → ゴミ箱 → 復元
- [ ] 共有リンク: 閲覧・ゲストアップロード・**Discord に貼って OGP カード展開**
- [ ] restricted フォルダが非メンバーに見えないこと（ADR-019）
- [ ] ログアウト
- [ ] admin: ユーザ管理・Ban・期限設定

## 6. 公開とロールバック

- 公開 = DNS を新サーバへ向ける（TBD: 手順は構成決定後に記載）
- **ロールバック**: 旧システムは `legacy` ブランチ・旧DB・旧写真ディレクトリとも無傷で残っているため、
  DNS を旧サーバへ戻すだけで復帰できる。新側で発生したアップロードは旧に戻らないので、
  切替直後は新規アップロードを控えめにアナウンスしておくと安全
- 安定稼働を確認したら旧サーバを read-only アーカイブ化（削除はしない）
