import { test, expect } from "@playwright/test";

// Regression cho 7 loading.tsx mới thêm (Phase 5 — xem tmp/phase5/GOAL.md
// LOAD-1/2). Lần thử trước dùng `page.goto(path)` mặc định (waitUntil:
// "load") — promise đó chỉ resolve SAU KHI RSC stream (Suspense fallback →
// nội dung thật) đã hoàn tất, nên không bao giờ bắt được khoảnh khắc Skeleton
// hiển thị dù có throttle CDP hay delay thật ở query. Dùng waitUntil:
// "commit" (resolve ngay khi có response header, TRƯỚC khi stream xong) để
// trả control về JS phía test trong lúc trang vẫn còn đang nhận nội dung
// stream — cho phép assert Skeleton rồi assert heading cuối cùng. Read-only.
const ROUTES = [
  { path: "/devices", heading: "Kho thiết bị" },
  { path: "/spare-parts", heading: "Kho phụ tùng" },
  { path: "/debts", heading: "Công nợ" },
  { path: "/repair-jobs", heading: "Job sửa xe múc" },
  { path: "/transactions", heading: "Giao dịch" },
  { path: "/kho", heading: "Kho hàng" },
  { path: "/settings", heading: "Cài đặt" },
];

for (const { path, heading } of ROUTES) {
  test(`${path} hiện Skeleton rồi vào đúng trang`, async ({ page }) => {
    const res = await page.goto(path, { waitUntil: "commit" });
    await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible();
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  });
}
