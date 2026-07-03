import { test, expect, type Page } from "@playwright/test";

// Verify màn Báo cáo (/reports, owner only):
//  - số liệu đúng theo kỳ (month/year), khớp DB dev
//  - đổi kỳ → toàn bộ card + bảng cập nhật
//  - % so kỳ trước tính đúng (gồm cả guard kỳ trước = 0 → "—")
// Ground truth lấy trực tiếp từ Postgres 5433 (xem log verify-app).

// Chỉ 3 card tổng quan dùng CardContent class "p-4"; các section card dùng
// "px-6" → dựa vào đó để không đụng card khác. hasText của Playwright
// case-insensitive nên phải scope hẹp.
const SUMMARY = '[data-slot="card-content"].p-4';
function revenueCard(page: Page) {
  return page.locator(SUMMARY).filter({ hasText: "Thực thu" });
}
function expenseCard(page: Page) {
  return page.locator(SUMMARY).filter({ hasText: "Gồm giá vốn" });
}
function profitCard(page: Page) {
  return page.locator(SUMMARY).filter({ hasText: /=\s*Doanh thu/ });
}

test.describe("Báo cáo — số liệu theo kỳ & % so kỳ trước", () => {
  test("Tháng 7/2026: summary + % + lãi gộp từng mảng khớp DB", async ({ page }) => {
    await page.goto("/reports?period=month&date=2026-07-15");

    // Nhãn kỳ
    await expect(page.getByText("Tháng 7/2026")).toBeVisible();
    // Nút Tháng đang active
    await expect(page.getByRole("link", { name: "Tháng" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    // --- Doanh thu: 7.800.000 ₫; kỳ trước (T6) = 0 → "—"; thực thu 7.800.000 ---
    const rev = revenueCard(page);
    await expect(rev).toContainText("7.800.000 ₫");
    await expect(rev).toContainText("so kỳ trước");
    await expect(rev).not.toContainText("%"); // prev=0 → không có %
    await expect(rev).toContainText("Thực thu");

    // --- Chi phí: 12.500.000 ₫; +257% (từ 3.500.000) ---
    const exp = expenseCard(page);
    await expect(exp).toContainText("12.500.000 ₫");
    await expect(exp).toContainText("+257% so kỳ trước");

    // --- Lãi: -4.700.000 ₫; -34% (từ -3.500.000) ---
    const profit = profitCard(page);
    await expect(profit).toContainText("4.700.000 ₫");
    await expect(profit).toContainText("-34% so kỳ trước");

    // --- Lãi gộp từng mảng ---
    const xeMuc = page.getByRole("row", { name: /Xe múc/ });
    await expect(xeMuc).toContainText("3.300.000 ₫"); // doanh thu
    await expect(xeMuc).toContainText("1.000.000 ₫"); // giá vốn (phụ tùng xuất)
    await expect(xeMuc).toContainText("5.000.000 ₫"); // chi phí mảng
    await expect(xeMuc).toContainText("-2.700.000 ₫"); // lãi gộp

    const thietBi = page.getByRole("row", { name: /Thiết bị điện tử/ });
    await expect(thietBi).toContainText("4.500.000 ₫"); // doanh thu (bán máy)
    await expect(thietBi).toContainText("3.500.000 ₫"); // giá vốn (mua máy)
    await expect(thietBi).toContainText("7.500.000 ₫"); // chi phí mảng
    await expect(thietBi).toContainText("-6.500.000 ₫"); // lãi gộp

    // Chi phí chung trong kỳ = 0
    const expenseSection = page
      .locator('[data-slot="card"]')
      .filter({ hasText: "Chi phí theo danh mục" });
    await expect(expenseSection).toContainText("chi phí chung");
    await expect(expenseSection).toContainText("0 ₫");
  });

  test("Đổi kỳ sang Năm 2026: số liệu đổi (chi phí 16tr, lãi -8,2tr), % = —", async ({
    page,
  }) => {
    await page.goto("/reports?period=month&date=2026-07-15");
    // Xác nhận trạng thái tháng trước khi đổi (chi phí 12.5tr)
    await expect(expenseCard(page)).toContainText("12.500.000 ₫");

    // Đổi sang Năm bằng chính link trên UI
    await page.getByRole("link", { name: "Năm" }).click();
    await expect(page).toHaveURL(/period=year/);

    await expect(page.getByText("Năm 2026")).toBeVisible();

    // Chi phí cả năm 16.000.000 (gồm cả T6 3.5tr) — KHÁC kỳ tháng → đã cập nhật
    const exp = expenseCard(page);
    await expect(exp).toContainText("16.000.000 ₫");
    await expect(exp).not.toContainText("12.500.000 ₫");
    await expect(exp).not.toContainText("%"); // 2025 = 0 → "—"

    // Doanh thu 7.800.000, prev 0 → "—"
    const rev = revenueCard(page);
    await expect(rev).toContainText("7.800.000 ₫");
    await expect(rev).not.toContainText("%");

    // Lãi -8.200.000 (7.8tr - 16tr), prev 0 → "—"
    const profit = profitCard(page);
    await expect(profit).toContainText("8.200.000 ₫");
    await expect(profit).not.toContainText("%");
  });

  test("Kỳ tháng 6/2026: mọi card % = — (kỳ trước = 0), số liệu khác T7", async ({
    page,
  }) => {
    await page.goto("/reports?period=month&date=2026-06-15");
    await expect(page.getByText("Tháng 6/2026")).toBeVisible();

    const rev = revenueCard(page);
    await expect(rev).toContainText("0 ₫"); // doanh thu 0
    await expect(rev).not.toContainText("%");

    const exp = expenseCard(page);
    await expect(exp).toContainText("3.500.000 ₫");
    await expect(exp).not.toContainText("%"); // T5 = 0 → "—"

    const profit = profitCard(page);
    await expect(profit).toContainText("3.500.000 ₫"); // lãi -3.500.000
    await expect(profit).not.toContainText("%");
  });
});
