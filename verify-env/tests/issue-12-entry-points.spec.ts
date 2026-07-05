import { test, expect } from "@playwright/test";

test.describe("Issue #12 — unified entry points", () => {
  test("mobile: + FAB has single Xe múc item, hub page shows 2 CTAs", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "FAB nav is sm:hidden on desktop viewport");
    await page.goto("/debts"); // pathname !== "/" so FAB opens the menu
    await page.getByRole("button", { name: "Nhập giao dịch" }).click();

    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: "Xe múc" })).toHaveCount(1);
    await expect(menu.getByRole("menuitem", { name: "Job sửa xe múc" })).toHaveCount(0);
    await expect(menu.getByRole("menuitem", { name: "Thiết bị điện tử" })).toHaveCount(1);

    await menu.getByRole("menuitem", { name: "Xe múc" }).click();
    await expect(page).toHaveURL(/\/transactions\/xe-muc$/);

    await expect(page.getByText("Tạo job sửa máy")).toBeVisible();
    await expect(page.getByText("Sửa máy cho khách, xuất phụ tùng từ kho")).toBeVisible();
    await expect(page.getByText("Nhập thu / chi")).toBeVisible();
    await expect(page.getByText("Nhiên liệu, lương, doanh thu cho thuê...")).toBeVisible();
  });

  test("mobile: xe múc CTAs navigate correctly", async ({ page }) => {
    await page.goto("/transactions/xe-muc");
    await page.getByText("Tạo job sửa máy").click();
    await expect(page).toHaveURL(/\/repair-jobs\/new$/);

    await page.goto("/transactions/xe-muc");
    await page.getByText("Nhập thu / chi").click();
    await expect(page).toHaveURL(/\/transactions\/xe-muc\/new$/);
  });

  test("round 2 fix: header 'Nhập' button dedup — hidden on xe-muc/devices hub, kept elsewhere", async ({
    page,
  }) => {
    await page.goto("/transactions/xe-muc");
    await expect(page.getByRole("link", { name: "Nhập", exact: true })).toHaveCount(0);

    await page.goto("/devices");
    await expect(page.getByRole("link", { name: "Nhập máy", exact: true })).toHaveCount(0);

    // Mảng không có hub vẫn giữ nút header (entry point duy nhất của trang đó).
    await page.goto("/transactions/phu-kien");
    await expect(page.getByRole("link", { name: "Nhập", exact: true })).toBeVisible();
  });

  test("round 2 fix: /transactions/xe-muc/new hiện cảnh báo chéo 'Tạo job sửa máy'", async ({
    page,
  }) => {
    await page.goto("/transactions/xe-muc/new");
    await expect(page.getByText("Tạo job sửa máy")).toBeVisible();
    await page.getByText("Tạo job sửa máy").click();
    await expect(page).toHaveURL(/\/repair-jobs\/new$/);

    // Mảng không có job concept thì không hiện cảnh báo này.
    await page.goto("/transactions/phu-kien/new");
    await expect(page.getByText("Tạo job sửa máy")).toHaveCount(0);
  });

  test("round 2 fix: QuickEntryDialog (trang chủ) đồng bộ lối 'Tạo job sửa máy' cho Xe múc", async ({
    page,
  }) => {
    await page.goto("/");
    // Trang chủ trên mobile có cả FAB (aria-label) lẫn nút "Nhập giao dịch" inline
    // trong nội dung trang — cùng mở 1 dialog, .first() để tránh strict-mode.
    await page.getByRole("button", { name: "Nhập giao dịch" }).first().click();
    await page.getByLabel("Mảng").selectOption({ label: "Xe múc" });

    await expect(page.getByText("Tạo job sửa máy")).toBeVisible();
    await expect(
      page.getByText("Sửa máy cho khách, xuất phụ tùng từ kho — dùng thay cho form bên dưới nếu có"),
    ).toBeVisible();

    await page.getByText("Tạo job sửa máy").click();
    await expect(page).toHaveURL(/\/repair-jobs\/new$/);
  });

  test("round 2 fix: SegmentedToggle có ARIA radiogroup/radio đúng", async ({ page }) => {
    await page.goto("/devices");
    await page.getByText("Bán máy từ kho").click();
    await expect(page).toHaveURL(/\/transactions\/thiet-bi\/new\?mode=sell$/);

    await expect(page.getByRole("radiogroup")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Bán máy trong kho" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.getByRole("radio", { name: "Thu khác (sửa chữa, phụ kiện...)" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  test("mobile: + FAB Thiết bị điện tử goes to /devices with 3 CTAs", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "FAB nav is sm:hidden on desktop viewport");
    await page.goto("/debts");
    await page.getByRole("button", { name: "Nhập giao dịch" }).click();
    await page.getByRole("menu").getByRole("menuitem", { name: "Thiết bị điện tử" }).click();
    await expect(page).toHaveURL(/\/devices$/);

    await expect(page.getByText("Nhập máy mới")).toBeVisible();
    await expect(page.getByText("Bán máy từ kho")).toBeVisible();
    await expect(page.getByText("Thu / Chi khác")).toBeVisible();
  });

  test("mobile: devices CTAs navigate correctly, sell CTA presets mode", async ({ page }) => {
    await page.goto("/devices");
    await page.getByText("Nhập máy mới").click();
    await expect(page).toHaveURL(/\/devices\/new$/);

    await page.goto("/devices");
    await page.getByText("Bán máy từ kho").click();
    await expect(page).toHaveURL(/\/transactions\/thiet-bi\/new\?mode=sell$/);
    // Mode active kiểm bằng role="radio"+aria-checked (xem test ARIA riêng bên dưới).
    await expect(page.getByRole("radio", { name: "Bán máy trong kho" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    // Mode "sell" đúng nhánh (không có máy tồn trong DB verify → empty-state riêng mode sell).
    await expect(page.getByText("Chưa có máy còn hàng trong kho.")).toBeVisible();

    await page.goto("/devices");
    await page.getByText("Thu / Chi khác").click();
    await expect(page).toHaveURL(/\/transactions\/thiet-bi\/new\?mode=income$/);
    await expect(
      page.getByRole("radio", { name: "Thu khác (sửa chữa, phụ kiện...)" }),
    ).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("Chưa có máy còn hàng trong kho.")).not.toBeVisible();
  });

  test("existing routes still reachable (backward compat)", async ({ page }) => {
    await page.goto("/repair-jobs");
    await expect(page.getByRole("heading", { name: "Job sửa xe múc" })).toBeVisible();

    await page.goto("/transactions/thiet-bi");
    await expect(page.getByRole("heading", { name: "Thiết bị điện tử" })).toBeVisible();

    await page.goto("/devices/new");
    await expect(page).toHaveURL(/\/devices\/new$/);
  });
});

test.describe("Issue #12 — desktop nav", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("desktop: Giao dịch dropdown Thiết bị điện tử goes to /devices", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Giao dịch", exact: true }).click();
    await page.getByRole("menuitem", { name: "Thiết bị điện tử" }).click();
    await expect(page).toHaveURL(/\/devices$/);
  });

  test("desktop: Giao dịch dropdown Xe múc still goes to hub page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Giao dịch", exact: true }).click();
    await page.getByRole("menuitem", { name: "Xe múc" }).click();
    await expect(page).toHaveURL(/\/transactions\/xe-muc$/);
  });
});
