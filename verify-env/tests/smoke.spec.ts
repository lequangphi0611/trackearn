import { test, expect } from "@playwright/test";

// Smoke test: chứng minh cả chuỗi login → storageState → browser đã đăng nhập
// hoạt động. Chỉ đọc/điều hướng, KHÔNG ghi dữ liệu (chạy trên DB dev thật).
test("session tái dùng — vào '/' không bị đá về /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/); // không bị redirect sang /login
  await expect(page.getByText("TrackEarn")).toBeVisible(); // header của dashboard layout
});
