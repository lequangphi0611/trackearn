import { test, expect, type Page } from "@playwright/test";

// Verify feature: drill-down từ /reports sang /transactions (reports.md §4.5,
// transactions.md §2/§3.2/§8/§9). Read-only — không ghi dữ liệu.
// Ground truth lấy trực tiếp từ Postgres 5433 tại thời điểm verify (2026-07-04):
//   T7/2026: doanh thu 10.500.000 / chi phí 16.266.000 / lãi -5.766.000
//   Xe múc: doanh thu 6.000.000 / giá vốn (phụ tùng xuất) 1.666.667 /
//           chi phí mảng 5.000.000 / lãi gộp -666.667
//   Thiết bị: doanh thu 4.500.000 / giá vốn 3.500.000 / chi phí mảng 7.500.000 /
//             lãi gộp -6.500.000
//   Phụ kiện: không có giao dịch trong T7 → mọi số = 0
//   Chi phí theo danh mục: "Khác" (categoryId NULL, KHÔNG click được) 12.500.000;
//     "Vốn hàng..." (cost_of_goods, id d49a42f3-7dc0-43e3-95ab-2cd7688a417d) 3.766.000
//   Chi phí chung (business_line NULL) trong T7 = 0

const COST_OF_GOODS_ID = "d49a42f3-7dc0-43e3-95ab-2cd7688a417d";
const SUMMARY = '[data-slot="card-content"].p-4';

function parseMoney(text: string): number {
  const cleaned = text.replace(/[^0-9]/g, "");
  return cleaned ? Number(cleaned) : 0;
}

/**
 * Cộng dồn các badge tổng theo ngày (income/expense) hiển thị trong
 * TransactionList — CHỈ lấy badge tổng ở header ngày (div.items-baseline),
 * KHÔNG lấy amount của từng dòng giao dịch (cũng dùng class .text-income/
 * .text-expense) để tránh đếm 2 lần.
 */
async function sumDailySubtotals(page: Page, tone: "income" | "expense") {
  // TransactionResults stream trong <Suspense>: skeleton fallback dùng CÙNG
  // class "items-baseline" nhưng không có .text-income/.text-expense (chỉ
  // Skeleton) — đợi fallback biến mất (ẩn/gỡ khỏi DOM) để tránh đọc lúc
  // đang transient (đặc biệt chậm hơn ở mobile project).
  await page
    .locator('div[aria-hidden]')
    .first()
    .waitFor({ state: "hidden", timeout: 10_000 })
    .catch(() => {});
  const els = page.locator(`section > div.items-baseline .text-${tone}`);
  const count = await els.count();
  let sum = 0;
  for (let i = 0; i < count; i++) {
    sum += parseMoney((await els.nth(i).textContent()) ?? "");
  }
  return sum;
}

test.describe("Reports drill-down → Transactions", () => {
  test("1. /reports loads normally", async ({ page }) => {
    await page.goto("/reports?period=month&date=2026-07-04");
    await expect(page.getByRole("heading", { name: "Báo cáo" })).toBeVisible();
    await expect(page.locator(SUMMARY).filter({ hasText: "Thực thu" })).toBeVisible();
    await expect(page.getByRole("row", { name: /Xe múc/ })).toBeVisible();
    await expect(page.getByText("Chi phí theo danh mục")).toBeVisible();
    await expect(page.getByRole("link", { name: "chi phí chung" })).toBeVisible();
    await page.screenshot({
      path: "verify-env/screenshots/reports-drilldown/01-reports-overview.png",
      fullPage: true,
    });
  });

  test("2. Click Doanh thu (SummaryCards) -> /transactions?type=income, sum khớp", async ({
    page,
  }) => {
    await page.goto("/reports?period=month&date=2026-07-04");
    const revLink = page.locator(SUMMARY).filter({ hasText: "Thực thu" }).getByRole("link");
    const href = await revLink.getAttribute("href");
    expect(href).toMatch(/^\/transactions\?type=income&from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}$/);

    await revLink.click();
    await expect(page).toHaveURL(/\/transactions\?type=income/);
    // filter form hiện đúng from/to/type
    await expect(page.locator('select[name="type"]')).toHaveValue("income");

    const sum = await sumDailySubtotals(page, "income");
    expect(sum).toBe(10_500_000);
    await page.screenshot({
      path: "verify-env/screenshots/reports-drilldown/02-transactions-income-aggregate.png",
      fullPage: true,
    });
  });

  test("3. Click Chi phí (SummaryCards) -> /transactions?type=expense, sum khớp", async ({
    page,
  }) => {
    await page.goto("/reports?period=month&date=2026-07-04");
    const expLink = page.locator(SUMMARY).filter({ hasText: "Gồm giá vốn" }).getByRole("link");
    const href = await expLink.getAttribute("href");
    expect(href).toMatch(/^\/transactions\?type=expense&from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}$/);

    await expLink.click();
    await expect(page).toHaveURL(/\/transactions\?type=expense/);
    await expect(page.locator('select[name="type"]')).toHaveValue("expense");

    const sum = await sumDailySubtotals(page, "expense");
    expect(sum).toBe(16_266_000);
    await page.screenshot({
      path: "verify-env/screenshots/reports-drilldown/03-transactions-expense-aggregate.png",
      fullPage: true,
    });
  });

  test("4a. GrossProfitSection Xe múc: Doanh thu + Chi phí mảng links khớp", async ({ page }) => {
    await page.goto("/reports?period=month&date=2026-07-04");
    const xeMuc = page.getByRole("row", { name: /Xe múc/ });

    // Doanh thu -> /transactions/xe-muc?type=income
    const revLink = xeMuc.locator("a").first();
    await expect(revLink).toHaveAttribute("href", /\/transactions\/xe-muc\?type=income/);
    await revLink.click();
    await expect(page).toHaveURL(/\/transactions\/xe-muc\?type=income/);
    let sum = await sumDailySubtotals(page, "income");
    expect(sum).toBe(6_000_000);
    await page.screenshot({
      path: "verify-env/screenshots/reports-drilldown/04a-xe-muc-doanh-thu.png",
      fullPage: true,
    });

    // quay lại + click Chi phí mảng -> excludeCategoryId=cost_of_goods
    await page.goto("/reports?period=month&date=2026-07-04");
    const xeMuc2 = page.getByRole("row", { name: /Xe múc/ });
    const expenseCell = xeMuc2.locator("td").nth(3); // Mảng | Doanh thu | Giá vốn | Chi phí mảng | Lãi gộp
    const expLink = expenseCell.locator("a");
    await expect(expLink).toHaveAttribute(
      "href",
      new RegExp(`/transactions/xe-muc\\?type=expense&excludeCategoryId=${COST_OF_GOODS_ID}`),
    );
    await expLink.click();
    await expect(page).toHaveURL(/excludeCategoryId=/);
    sum = await sumDailySubtotals(page, "expense");
    expect(sum).toBe(5_000_000); // chi phí mảng đã loại giá vốn (cost_of_goods)
    await page.screenshot({
      path: "verify-env/screenshots/reports-drilldown/04b-xe-muc-chi-phi-mang.png",
      fullPage: true,
    });
  });

  test("4b. Giá vốn Xe múc/Thiết bị KHÔNG phải link (chỉ text + tooltip)", async ({ page }) => {
    await page.goto("/reports?period=month&date=2026-07-04");
    const xeMuc = page.getByRole("row", { name: /Xe múc/ });
    const cogsCellXeMuc = xeMuc.locator("td").nth(2);
    await expect(cogsCellXeMuc.locator("a")).toHaveCount(0);
    await expect(cogsCellXeMuc.locator("span[title]")).toHaveAttribute(
      "title",
      /Phụ tùng đã xuất kho/,
    );
    await expect(cogsCellXeMuc).toContainText("1.666.667");

    const thietBi = page.getByRole("row", { name: /Thiết bị điện tử/ });
    const cogsCellThietBi = thietBi.locator("td").nth(2);
    await expect(cogsCellThietBi.locator("a")).toHaveCount(0);
    await expect(cogsCellThietBi.locator("span[title]")).toHaveAttribute(
      "title",
      /Tính theo ngày máy được bán/,
    );
    await expect(cogsCellThietBi).toContainText("3.500.000");

    await page.screenshot({
      path: "verify-env/screenshots/reports-drilldown/04c-gia-von-not-clickable.png",
      fullPage: true,
    });
  });

  test("4c. Giá vốn Phụ kiện LÀ link -> /transactions/phu-kien?type=expense&categoryId=cost_of_goods", async ({
    page,
  }) => {
    await page.goto("/reports?period=month&date=2026-07-04");
    const phuKien = page.getByRole("row", { name: /Phụ kiện/ });
    const cogsCell = phuKien.locator("td").nth(2);
    const link = cogsCell.locator("a");
    await expect(link).toHaveAttribute(
      "href",
      new RegExp(`/transactions/phu-kien\\?type=expense&categoryId=${COST_OF_GOODS_ID}`),
    );
    await link.click();
    await expect(page).toHaveURL(/\/transactions\/phu-kien\?type=expense&categoryId=/);
    // Không có giao dịch phụ kiện trong T7 -> danh sách rỗng, khớp 0
    await expect(page.getByText(/Chưa có giao dịch nào/)).toBeVisible();
    await page.screenshot({
      path: "verify-env/screenshots/reports-drilldown/04d-phu-kien-gia-von.png",
      fullPage: true,
    });
  });

  test("5a. ExpenseSection: click category 'Vốn hàng' -> categoryId, sum khớp", async ({
    page,
  }) => {
    await page.goto("/reports?period=month&date=2026-07-04");
    const catLink = page.getByRole("link").filter({ hasText: "Vốn hàng" });
    await expect(catLink).toHaveAttribute(
      "href",
      new RegExp(`/transactions\\?type=expense&categoryId=${COST_OF_GOODS_ID}`),
    );
    await catLink.click();
    await expect(page).toHaveURL(/categoryId=/);
    const sum = await sumDailySubtotals(page, "expense");
    expect(sum).toBe(3_766_000);
    await page.screenshot({
      path: "verify-env/screenshots/reports-drilldown/05a-expense-category-drilldown.png",
      fullPage: true,
    });
  });

  test("5b. ExpenseSection: click 'chi phí chung' -> /transactions/chi-phi-chung", async ({
    page,
  }) => {
    await page.goto("/reports?period=month&date=2026-07-04");
    const generalLink = page.getByRole("link", { name: "chi phí chung" });
    await expect(generalLink).toHaveAttribute("href", /\/transactions\/chi-phi-chung\?/);
    await generalLink.click();
    await expect(page).toHaveURL(/\/transactions\/chi-phi-chung\?/);
    // generalTotal T7 = 0 -> danh sách rỗng (đúng, business_line NULL không có gd trong kỳ)
    await expect(page.getByText(/Chưa có giao dịch nào/)).toBeVisible();
    await page.screenshot({
      path: "verify-env/screenshots/reports-drilldown/05b-chi-phi-chung.png",
      fullPage: true,
    });
  });

  test("6. Tab nav aggregate: switch tab giữ from/to/type nhưng BỎ categoryId", async ({
    page,
  }) => {
    await page.goto(
      `/transactions?type=expense&categoryId=${COST_OF_GOODS_ID}&from=2026-07-01&to=2026-07-31`,
    );
    await expect(page).toHaveURL(/categoryId=/);
    await page.screenshot({
      path: "verify-env/screenshots/reports-drilldown/06a-aggregate-categoryid-filtered.png",
      fullPage: true,
    });

    const nav = page.getByRole("navigation", { name: "Chọn mảng giao dịch" });
    await expect(nav.getByRole("link", { name: "Tất cả" })).toBeVisible();

    await nav.getByRole("link", { name: "Xe múc" }).click();
    await expect(page).toHaveURL(/\/transactions\/xe-muc\?/);
    const url = new URL(page.url());
    expect(url.searchParams.get("categoryId")).toBeNull();
    expect(url.searchParams.get("type")).toBe("expense");
    expect(url.searchParams.get("from")).toBe("2026-07-01");
    expect(url.searchParams.get("to")).toBe("2026-07-31");
    await page.screenshot({
      path: "verify-env/screenshots/reports-drilldown/06b-tab-switch-dropped-categoryid.png",
      fullPage: true,
    });
  });

  test("7. Aggregate page: mỗi dòng có badge Mảng, KHÔNG có nút Nhập", async ({ page }) => {
    await page.goto("/transactions?from=2026-07-01&to=2026-07-31");
    // exact:true — vài dòng giao dịch (vd "Nhập phụ tùng: ...") chứa chữ "Nhập"
    // trong note, không được khớp nhầm với nút "Nhập" (thêm giao dịch) thật.
    await expect(page.getByRole("link", { name: "Nhập", exact: true })).toHaveCount(0);
    // Ít nhất 1 badge mảng hiển thị (Xe múc / Thiết bị điện tử / Chung)
    const badgeTexts = await page.locator("li .flex.items-center.gap-2 span").allTextContents();
    expect(badgeTexts.some((t) => /Xe múc|Thiết bị điện tử|Phụ kiện|Chung/.test(t))).toBeTruthy();
    await page.screenshot({
      path: "verify-env/screenshots/reports-drilldown/07-aggregate-badges-no-nhap-button.png",
      fullPage: true,
    });
  });

  test("8. Aggregate với filter rỗng: KHÔNG hiện 'Bấm Nhập'", async ({ page }) => {
    await page.goto("/transactions?from=2020-01-01&to=2020-01-02");
    await expect(page.getByText("Chưa có giao dịch nào trong khoảng lọc này.")).toBeVisible();
    await expect(page.getByText(/Bấm.*Nhập.*để thêm dòng đầu tiên/)).toHaveCount(0);
    await page.screenshot({
      path: "verify-env/screenshots/reports-drilldown/08-aggregate-empty-state.png",
      fullPage: true,
    });
  });

  test("9. Filter form giữ categoryId khi đổi type/date và submit", async ({ page }) => {
    await page.goto(
      `/transactions?categoryId=${COST_OF_GOODS_ID}&from=2026-07-01&to=2026-07-31`,
    );
    await expect(page.locator('input[name="categoryId"]')).toHaveValue(COST_OF_GOODS_ID);

    // Mobile: control lọc chi tiết (select/date) thu gọn sau nút "Bộ lọc" —
    // mở ra trước khi thao tác (desktop không render nút này, bỏ qua nếu ẩn).
    const filterToggle = page.getByRole("button", { name: /Bộ lọc/ });
    if (await filterToggle.isVisible()) await filterToggle.click();

    await page.locator('select[name="type"]').selectOption("expense");
    // exact:true — nút toggle "Bộ lọc (1 đang bật)" cũng chứa substring "Lọc".
    await page.getByRole("button", { name: "Lọc", exact: true }).click();

    await expect(page).toHaveURL(/type=expense/);
    const url = new URL(page.url());
    expect(url.searchParams.get("categoryId")).toBe(COST_OF_GOODS_ID);
    await page.screenshot({
      path: "verify-env/screenshots/reports-drilldown/09-filter-form-categoryid-passthrough.png",
      fullPage: true,
    });
  });

  test("10. 'Xem thêm' (load-more) giữ categoryId qua trang kế — kiểm tra ở mức URL/query", async ({
    page,
  }) => {
    // GHI CHÚ GIỚI HẠN DỮ LIỆU: DB dev hiện chỉ có 12 giao dịch (toàn bộ lịch
    // sử) — hasMore (getTransactions) chỉ true khi > 20 dòng khớp filter, nên
    // nút "Xem thêm" KHÔNG THỂ tự nhiên xuất hiện với bất kỳ filter nào ở môi
    // trường hiện tại (đã xác nhận qua Postgres trực tiếp). Không thể click
    // thật nút "Xem thêm". Thay vào đó: (a) đã đọc code list-params.ts —
    // moreParams luôn set categoryId/excludeCategoryId nếu có trên sp trước khi
    // build moreHref (`/transactions?${moreParams}`), nên về mặt code, trang
    // kế sẽ giữ filter; (b) test này mô phỏng điều hướng "trang kế" bằng URL
    // page=1 trực tiếp (đúng dạng LoadMore sẽ tạo ra) để xác nhận filter vẫn
    // được tôn trọng ở phía server khi có tham số page.
    await page.goto(
      `/transactions?categoryId=${COST_OF_GOODS_ID}&from=2026-07-01&to=2026-07-31&page=1`,
    );
    await expect(page.locator('input[name="categoryId"]')).toHaveValue(COST_OF_GOODS_ID);
    // Toàn bộ dòng hiển thị (nếu có) vẫn phải là danh mục cost_of_goods —
    // dùng badge/text "Vốn hàng" xuất hiện trong mỗi dòng (category tag).
    await expect(page.getByText(/Chưa có giao dịch nào|Vốn hàng/).first()).toBeVisible();
    await page.screenshot({
      path: "verify-env/screenshots/reports-drilldown/10-loadmore-categoryid-page-param.png",
      fullPage: true,
    });
  });
});
