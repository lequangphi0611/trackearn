import { test as setup, expect } from "@playwright/test";
import { loadConfig, STORAGE_STATE } from "./lib/config";

// Đăng nhập một lần qua Better Auth API, lưu session vào storageState để mọi
// spec sau (project "chromium") khởi động ở trạng thái đã đăng nhập.
setup("authenticate", async ({ request }) => {
  const cfg = loadConfig();

  // App phải reachable VÀ DB phải up (health trả 200). Nếu DB down → 503.
  const health = await request.get("/api/health");
  expect(
    health.ok(),
    `App không reachable hoặc DB down tại ${cfg.baseURL}/api/health ` +
      `(status ${health.status()}). Hãy chắc chắn 'pnpm dev' (3000) + Postgres (5433) đang chạy.`,
  ).toBeTruthy();

  // Endpoint chuẩn của Better Auth (basePath mặc định /api/auth).
  const res = await request.post("/api/auth/sign-in/email", {
    data: { email: cfg.email, password: cfg.password },
  });
  expect(
    res.ok(),
    `Đăng nhập thất bại: ${res.status()} ${await res.text()}. ` +
      `Kiểm tra email/password trong verify.config.json có đúng tài khoản đã tồn tại trong DB dev không.`,
  ).toBeTruthy();

  await request.storageState({ path: STORAGE_STATE });

  // --- UI FALLBACK (chỉ dùng nếu API sign-in đổi/route trả 403 CSRF) ---
  // Bỏ comment và thay thế block API ở trên bằng đoạn dưới, và đổi fixture
  // của setup() thành ({ page }) thay vì ({ request }):
  //
  // await page.goto("/login");
  // await page.fill('input[name="email"]', cfg.email);
  // await page.fill('input[name="password"]', cfg.password);
  // await page.getByRole("button", { name: "Đăng nhập" }).click();
  // await page.waitForURL("/");
  // await page.context().storageState({ path: STORAGE_STATE });
});
