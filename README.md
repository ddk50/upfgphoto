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
# frontend
cd frontend
npm install
npm run dev      # http://localhost:5173/
npm test         # vitest（アクセス制御の仕様表テスト等）
npm run build    # tsc + vite build
```

backend のセットアップは構築後に追記。
