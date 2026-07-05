import { test, expect } from "@playwright/test";

// Kiểm chứng src/app/error.tsx (global boundary, bắt buộc theo
// docs/rules/error-handling.md) qua route test-only /dev/throw — chỉ tồn tại
// khi NODE_ENV !== "production" (src/app/(dashboard)/dev/throw/page.tsx).
// Read-only, không ghi dữ liệu.
test("error.tsx global bắt lỗi Server Component, không lộ stack trace, reset không crash", async ({
  page,
}) => {
  await page.goto("/dev/throw");

  await expect(page.getByText("Đã có lỗi xảy ra.")).toBeVisible();
  const retry = page.getByRole("button", { name: "Thử lại" });
  await expect(retry).toBeVisible();

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toMatch(/SELECT|at Object|at async|node_modules/i);

  // /dev/throw luôn throw lại — verify reset() không làm trắng trang/crash.
  await retry.click();
  await expect(page.getByText("Đã có lỗi xảy ra.")).toBeVisible();
});
