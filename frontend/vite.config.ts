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
      "/api": BACKEND,
      "/auth": BACKEND,
      "/logout": BACKEND,
      "/dev": BACKEND,
      "/rails": BACKEND,
    },
  },
})
