import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// /api ほかを backend (Rails, :3000) へプロキシ。Cookie セッションを同一オリジンで扱う
const BACKEND = "http://localhost:3000"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // 文字列短縮形は changeOrigin: true (Host を :3000 に書き換え) になり、
      // Rails の CSRF Origin チェック (Origin ヘッダ vs base_url) が落ちる。
      // Host を保存して Rails に「自分は localhost:5173」と見せることで、
      // Origin 検証と OAuth コールバック URL の生成を :5173 基準に揃える
      "/api": { target: BACKEND },
      "/auth": { target: BACKEND },
      "/logout": { target: BACKEND },
      "/dev": { target: BACKEND },
      "/rails": { target: BACKEND },
    },
  },
})
