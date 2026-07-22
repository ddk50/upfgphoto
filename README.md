# uprun (upfgphoto v2)

写真共有サービス upfgphoto のフルリプレイス。モノレポ構成。

- 旧システム（jQuery + Rails, 2013〜）は **`legacy` ブランチ / タグ `legacy-final`** に凍結
- 設計判断は [docs/ADR.md](docs/ADR.md)、本番切替手順は [docs/MIGRATION.md](docs/MIGRATION.md)、API 仕様は [docs/API.md](docs/API.md) に記録

## 構成

| ディレクトリ | 内容 | 詳細 |
|---|---|---|
| `backend/` | Rails 8.1 + MySQL 8 + ActiveStorage。API サーバ（SPA・OGP も配信） | [backend/README.md](backend/README.md) |
| `frontend/` | React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui。SPA | 下記 |
| `docs/` | ADR（設計判断）・移行手順・API 仕様 | — |

## 開発

### backend

Rails API サーバ。起動・環境変数・rake タスク（ETL 等）・テストはすべて **[backend/README.md](backend/README.md)** を参照。

### frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173/ （/api 等は :3000 へプロキシ）
npm test         # vitest（アクセス制御の仕様表テスト等）
npm run build    # tsc + vite build
```

ログイン: 開発は画面の「開発用ログイン」に user id（例: 1 = admin）。本番は Google OAuth（詳細は [backend/README.md](backend/README.md)）。

## デプロイ / 本番切替

本番は Rails 単一コンテナ（ADR-025）。手順・残タスクは [docs/MIGRATION.md](docs/MIGRATION.md) を参照。
