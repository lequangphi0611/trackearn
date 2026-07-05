import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Override qua NEXT_DIST_DIR — dùng bởi verify-env/playwright.pwa.config.ts
  // để build production test ra thư mục riêng, không đụng .next/ mà `pnpm dev`
  // hoặc một build thường khác trên cùng máy đang dùng chung.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // pino (+ transport pino-pretty) phải chạy ngoài bundle để worker thread
  // resolve được module lúc runtime, nếu không sẽ lỗi "unable to determine
  // transport target". Xem docs/rules/logging.md.
  serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],
};

export default nextConfig;
