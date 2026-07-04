import { test, expect } from "@playwright/test";

// Regression cho 7 loading.tsx mới thêm (Phase 5 — xem tmp/phase5/GOAL.md
// LOAD-1/2). Ghi chú: đã thử throttle qua CDP Network.emulateNetworkConditions
// và cả delay thật ở query (2s) để bắt khoảnh khắc Skeleton hiện ra giữa lúc
// tải — nhưng route-level Suspense boundary của loading.tsx không stream một
// cách quan sát được qua page.goto() full navigation trong môi trường này (kể
// cả với delay thật), nên test được rút gọn xuống mức đáng tin cậy: xác nhận
// route vẫn vào đúng, không vỡ, sau khi thêm loading.tsx. Read-only.
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
  test(`${path} vào đúng trang sau khi thêm loading.tsx`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  });
}
