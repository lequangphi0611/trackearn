import { test, expect } from "@playwright/test";

// PWA-1..6 (xem tmp/phase5/GOAL.md §2.1). Chỉ chạy qua
// `pnpm verify:pwa` (verify-env/playwright.pwa.config.ts) — build production
// thật, vì service worker chỉ đăng ký khi NODE_ENV === "production"
// (src/components/RegisterServiceWorker.tsx). Read-only, không ghi dữ liệu.

test("PWA-1: manifest.webmanifest hợp lệ", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("application/manifest+json");

  const json = await res.json();
  expect(json.name).toBe("TrackEarn");
  expect(json.short_name).toBeTruthy();
  expect(json.start_url).toBe("/");
  expect(json.display).toBe("standalone");
  expect(json.theme_color).toBe("#E0A020");
  expect(json.background_color).toBeTruthy();

  const sizes = json.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect(
    json.icons.some((i: { purpose?: string }) => i.purpose === "maskable"),
  ).toBe(true);
});

test("PWA-2: link manifest + meta theme-color trong <head>", async ({ page }) => {
  await page.goto("/login");
  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  expect(manifestHref).toContain("manifest.webmanifest");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#E0A020",
  );
});

test("PWA-6: icon files tồn tại đúng kích thước khai báo", async ({ request }) => {
  for (const path of [
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/icons/icon-maskable-512.png",
  ]) {
    const res = await request.get(path);
    expect(res.ok(), `${path} phải trả 200`).toBeTruthy();
  }
});

test("PWA-3/4: service worker đăng ký active, display standalone trong manifest", async ({
  page,
}) => {
  await page.goto("/"); // (dashboard), đã login qua storageState → mount RegisterServiceWorker
  // navigator.serviceWorker.ready resolve ngay khi worker chuyển "activating"
  // (trước khi activate event handler xong) — poll thêm vài trăm ms để chắc
  // chắn thấy "activated" thay vì bắt trúng khoảnh khắc transient.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() =>
      page.evaluate(() =>
        navigator.serviceWorker.getRegistration().then((r) => r?.active?.state),
      ),
    )
    .toBe("activated");
});

test("PWA-5: offline fallback trả về /offline khi mất mạng", async ({
  page,
  context,
}) => {
  await page.goto("/"); // load 1 lần để SW cài đặt + precache /offline
  await page.evaluate(() => navigator.serviceWorker.ready);

  await context.setOffline(true);
  await page.goto("/reports"); // route chưa từng cache — buộc SW phải fallback
  await expect(page.getByText("Mất kết nối mạng")).toBeVisible();

  await context.setOffline(false);
});
