# uprun プロジェクトガイド

写真共有サービス upfgphoto のフルリプレイス（モノレポ）。旧システムは `legacy` ブランチに凍結済み。

## 現在地（2026-07-19 時点）

**完了**: モック(仕様確定, ADR-001〜022) → モノレポ化 → backend(Rails 8.1/Ruby 4.0) → ETL → Google認証+紐付けフロー → /api/v1 全実装 → フロント全画面API接続(mock層削除済み) → 全環境MySQL 8統一(trilogy, ADR-021) → ゴミ箱=論理削除+日次trash:purge(ADR-022) → **実データ完全取り込み済み(写真26,684枚/121GB/欠損0)**

**本番切替前の残タスク**:
1. Google OAuth 資格情報 (Cloud Console) — ユーザ作業
2. 本番配信構成 (React ビルドを Rails から配信) + Api::V1::BaseController の CSRF TODO
3. ETL レポートの nickname 不整合5件 (46malonu, celeron1ghz, c5vecco, MooncraftShiden, Akiba_univ) の expires_at 手動判断
4. ステージングのサーバ設置場所は未定 (構成コードは staging 環境として準備済み)

**ローカル開発の起動**: README.md 参照。dev ログインは画面の「開発用ログイン」に user id (1=admin tatarou1986)。MySQL は `backend/compose.yaml` (docker)。旧DB/写真原本は `~/repos/upfgphoto` (legacy ブランチ・凍結)。

## 最重要ドキュメント

- **`docs/ADR.md`** — 全設計判断（ADR-001〜020）。仕様の疑問はまずここを見る。新しい設計判断も必ずここに追記する
- `frontend/src/lib/access.test.ts` — アクセス制御（ADR-019 無条件隷属ルール）の実行可能な仕様書。backend 実装時は RSpec に移植する

## 設計の柱（詳細は ADR）

- フォルダは実体を持たず、写真の path 文字列から導出される仮想概念（ADR-003）。空フォルダは存在しない（ADR-014）
- タグは内部実装。一般 UI は「キーワード」と横断検索バーで吸収（ADR-004）
- 3ロール: admin / user / guest。アクセス制御はフォルダ単位・親→子継承（ADR-005, 006）
- オーナー = パスを最初に実体化した人。公開設定は他人の restricted に無条件隷属（ADR-019）
- 共有リンクは 22文字 base62 トークン、発行・停止は台帳記録（ADR-008, 018）
- 認証: Google OAuth のみ（uid = OIDC `sub`）。旧 Twitter UID は identities テーブルで併存（ADR-020 / 移行プラン）

## リポジトリ運用

- このリポジトリは旧 upfgphoto と同一（git worktree）。`~/repos/upfgphoto` は `legacy` ブランチのまま凍結し、旧本番の参照・ETL 入力元（`db/production.sqlite3`・`data/prod/`、いずれも gitignore 済み）として使う
- **`*.sqlite3` と `data/` は絶対にコミットしない**（実ユーザの個人データ）

## 規約

- 新規フロントエンドコードは TypeScript 必須
- frontend: `npm run build`（tsc 込み）と `npm test` を通してから完了とする
- 大きめの実装は方向性をすり合わせてから着手（ユーザの明示的な好み）
