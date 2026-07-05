import { defineConfig, devices } from "@playwright/test";
import { loadConfig, STORAGE_STATE } from "./lib/config";

const { baseURL } = loadConfig();

// Hạ tầng cho skill `verify` mượn dùng — KHÔNG phải bộ test nghiệp vụ.
// - project "setup": đăng nhập 1 lần, lưu storageState (session cookie).
// - project "chromium": desktop, mọi spec bắt đầu ĐÃ đăng nhập nhờ storageState.
// - project "mobile": Chrome trên Pixel 5 (viewport mobile + touch) — TrackEarn
//   là PWA mobile-first nên đây mới là môi trường sát người dùng thật nhất.
export default defineConfig({
  // testDir = gốc verify-env để bắt cả auth.setup.ts (gốc) lẫn tests/*.spec.ts.
  // Mỗi project lọc file bằng testMatch để không chạy chéo.
  testDir: ".",
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      testMatch: /tests[\\/].*\.spec\.ts/,
      testIgnore: /pwa\.spec\.ts/, // chỉ chạy qua `pnpm verify:pwa` (build production)
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
    },
    {
      name: "mobile",
      testMatch: /tests[\\/].*\.spec\.ts/,
      testIgnore: /pwa\.spec\.ts/, // chỉ chạy qua `pnpm verify:pwa` (build production)
      use: { ...devices["Pixel 5"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
    },
  ],
  // Tự khởi động `next dev` nếu chưa chạy; reuse nếu đã có server ở port 3000.
  // LƯU Ý: /api/health trả 503 khi DB down → Playwright coi là chưa ready và
  // sẽ chờ tới timeout. Vì vậy Postgres (port 5433) PHẢI chạy trước khi verify.
  webServer: {
    command: "pnpm dev",
    cwd: "..",
    url: `${baseURL}/api/health`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
