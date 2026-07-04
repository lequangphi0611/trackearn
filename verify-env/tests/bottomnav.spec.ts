import { test, expect } from "@playwright/test";

// Verify feature: BottomNav (điều hướng mobile). Read-only — không ghi dữ liệu.
// src: src/app/(dashboard)/components/BottomNav.tsx, layout.tsx,
//      src/lib/quick-entry-store.ts, dashboard/QuickEntryDialog.tsx,
//      src/lib/transaction-lines.ts
// BottomNav CHỈ render container `sm:hidden` — mọi test hành vi bên trong chỉ
// có ý nghĩa ở project "mobile"; project "chromium" chỉ kiểm nav bị ẩn.

test.describe("BottomNav", () => {
  test("ẩn ở desktop, hiện ở mobile (sm:hidden)", async ({ page }, testInfo) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Điều hướng" });
    if (testInfo.project.name === "mobile") {
      await expect(nav).toBeVisible();
    } else {
      await expect(nav).toBeHidden();
    }
  });

  test("5 mục đúng nhãn: Tổng quan / Giao dịch / [+] / Công nợ / Kho", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "BottomNav chỉ hiện ở mobile");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Điều hướng" });
    await expect(nav.getByRole("link", { name: "Tổng quan" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Giao dịch" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Công nợ" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Kho" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Nhập giao dịch" })).toBeVisible();
    await page.screenshot({
      path: "verify-env/screenshots/bottomnav/01-mobile-nav.png",
    });
  });

  test("active tab đúng theo route, kể cả Kho xuyên /kho, /devices, /spare-parts", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "BottomNav chỉ hiện ở mobile");
    const nav = page.getByRole("navigation", { name: "Điều hướng" });

    await page.goto("/");
    await expect(nav.getByRole("link", { name: "Tổng quan" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      nav.getByRole("link", { name: "Giao dịch" }),
    ).not.toHaveAttribute("aria-current", "page");

    await page.goto("/transactions");
    await expect(nav.getByRole("link", { name: "Giao dịch" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.goto("/debts");
    await expect(nav.getByRole("link", { name: "Công nợ" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.goto("/kho");
    await expect(nav.getByRole("link", { name: "Kho" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.goto("/devices");
    await expect(nav.getByRole("link", { name: "Kho" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.goto("/spare-parts");
    await expect(nav.getByRole("link", { name: "Kho" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("FAB tại / mở thẳng QuickEntryDialog (không qua menu)", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "BottomNav chỉ hiện ở mobile");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Điều hướng" });
    await nav.getByRole("button", { name: "Nhập giao dịch" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Nhập giao dịch nhanh" }),
    ).toBeVisible();
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("FAB tại trang khác (/transactions) mở menu điều hướng nhập, không phải dialog", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "BottomNav chỉ hiện ở mobile");
    await page.goto("/transactions");
    const nav = page.getByRole("navigation", { name: "Điều hướng" });
    await nav.getByRole("button", { name: "Nhập giao dịch" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Xe múc", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Thiết bị điện tử" }),
    ).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Phụ kiện" })).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Chi phí chung" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Job sửa xe múc" }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Chọn 1 mục điều hướng thật sang màn nhập giao dịch mảng đó.
    await page.getByRole("menuitem", { name: "Xe múc", exact: true }).click();
    await expect(page).toHaveURL(/\/transactions\/xe-muc\/new$/);
  });
});
