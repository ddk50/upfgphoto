# uprun (upfgphoto v2)

写真共有サービス upfgphoto のフルリプレイス。モノレポ構成。

- 旧システム（jQuery + Rails, 2013〜）は **`legacy` ブランチ / タグ `legacy-final`** に凍結
- 設計判断はすべて [docs/ADR.md](docs/ADR.md) に記録（ADR-001〜020）

## 構成

| ディレクトリ | 内容 |
|---|---|
| `frontend/` | React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui。UIモックとして開発され、API 接続版へ発展中 |
| `backend/` | Rails（最新）+ SQLite + ActiveStorage。API サーバ（構築中） |
| `docs/` | ADR（アーキテクチャ決定記録）ほか |

## 開発

```bash
# backend (Rails 8.1 / Ruby 4.0, rbenv)
cd backend
bundle install
bin/rails db:migrate
bin/rails etl:import   # 旧DBから開発データ投入 (upfgphoto/db/production.sqlite3)
bin/rails server       # :3000
bin/check              # rubocop + rspec

# frontend (別ターミナル。/api 等は :3000 へプロキシ)
cd frontend
npm install
npm run dev      # http://localhost:5173/
npm test         # vitest（アクセス制御の仕様表テスト等）
npm run build    # tsc + vite build
```

ログイン: 開発環境ではログイン画面の「開発用ログイン」に user id（例: 1 = admin）。
本番は Google OAuth（`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` が必要）。
