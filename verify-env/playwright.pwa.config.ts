import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE } from "./lib/config";

// Config riêng cho verify-env/tests/pwa.spec.ts — SW chỉ đăng ký ở
// production (xem src/components/RegisterServiceWorker.tsx), nên PHẢI chạy
// trên build production thật, KHÔNG dùng `pnpm dev` như playwright.config.ts
// thường. Port 3100 để né trackearn-app-1 (Docker) đang chiếm port 3000.
const PWA_BASE_URL = "http://localhost:3100";

export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: PWA_BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "mobile",
      testMatch: /tests[\\/]pwa\.spec\.ts/,
      use: { ...devices["Pixel 5"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    // next.config.ts dùng output: "standalone" → "next start" KHÔNG chạy
    // đúng (thiếu asset), phải dùng server.js standalone giống Dockerfile,
    // và tự copy public/ + .next/static vào .next/standalone/ trước (Docker
    // làm việc này qua COPY, ngoài Docker phải làm thủ công).
    command:
      "pnpm build && node scripts/prepare-standalone.mjs && node .next/standalone/server.js",
    cwd: "..",
    url: `${PWA_BASE_URL}/api/health`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: { PORT: "3100" },
  },
});
