# locator-map — cache locator đã đọc

Lưu locator đã suy ra từ source để đỡ grep lại. **Đây là cache dễ stale nhất** —
luôn kèm `src` + `verified` và áp GIAO THỨC FRESHNESS trước khi tin.

> Ưu tiên: locator sống trong spec file (`tests/*.spec.ts`) vẫn là chân lý. File
> này chỉ là chỉ mục tra nhanh; khi spec và map mâu thuẫn, tin spec.

## Format mỗi entry

```
### <Màn hình / component>
| element | locator | src | verified |
|---|---|---|---|
| <mô tả, vd "nút Lưu"> | <getByRole/getByTestId/...> | <file source> | <hash/ngày> |
```

> Nếu `src` của một dòng đã đổi kể từ `verified` → đọc lại component đó, cập nhật
> locator. Locator entry thiếu `src`/`verified` = coi như stale.

Khuyến nghị chọn locator bền: `getByRole` + tên, `getByTestId`, `getByLabel` —
tránh CSS/nth-child dễ vỡ.

---

### Báo cáo — card tổng quan & controls
| element | locator | src | verified |
|---|---|---|---|
| 3 card tổng quan (chỉ chúng) | `[data-slot="card-content"].p-4` (section card dùng `.px-6`) | src/components/ui/card.tsx, reports/components/SummaryCards.tsx | b52fcfb |
| card Doanh thu | `SUMMARY.filter({hasText:'Thực thu'})` | SummaryCards.tsx | b52fcfb |
| card Chi phí | `SUMMARY.filter({hasText:'Gồm giá vốn'})` | SummaryCards.tsx | b52fcfb |
| card Lãi | `SUMMARY.filter({hasText:/=\s*Doanh thu/})` | SummaryCards.tsx | b52fcfb |
| badge % | text `"+257% so kỳ trước"` / `"— so kỳ trước"` (prev=0 → không có `%`) | SummaryCards.tsx (ChangeBadge), lib/format.ts | b52fcfb |
| nút chọn kỳ | `getByRole('link',{name:'Tháng'|'Quý'|'Năm'})`, active = `aria-current="page"` | reports/components/PeriodControls.tsx | b52fcfb |
| nhãn kỳ | text `"Tháng 7/2026"` / `"Quý 3/2026"` / `"Năm 2026"` | PeriodControls.periodLabel | b52fcfb |
| dời kỳ | `getByRole('link',{name:'Kỳ trước'|'Kỳ sau'})` | PeriodControls.tsx | b52fcfb |
| hàng lãi gộp mảng | `getByRole('row',{name:/Xe múc|Thiết bị điện tử|Phụ kiện/})`, tiền có hậu tố ` ₫` | reports/components/GrossProfitSection.tsx | b52fcfb |

> Lưu ý: `hasText` của Playwright **case-insensitive** + normalize khoảng trắng →
> "Gồm giá vốn" cũng khớp "...không gồm giá vốn..." ở card lãi gộp. Vì vậy phải
> scope `.p-4` cho card tổng quan trước khi filter.

### Phụ tùng — form tạo mới & dialog Nhập thêm & chi tiết
Field.tsx render `<Input id=name>` + `<Label htmlFor=name>` → dùng `getByLabel`.
| element | locator | src | verified |
|---|---|---|---|
| form tạo: Tên/Đơn vị/SL/Giá | `getByLabel('Tên phụ tùng')`, `getByLabel(/Đơn vị/)`, `getByLabel('Số lượng nhập')`, `getByLabel(/Giá nhập/)` | SparePartForm.tsx, Field.tsx | b52fcfb |
| nút lưu tạo mới | `getByRole('button',{name:'Lưu nhập kho'})` | SparePartForm.tsx | b52fcfb |
| nút mở dialog restock | `getByRole('button',{name:'Nhập thêm'})` | spare-parts/[id]/page.tsx, RestockDialog.tsx | b52fcfb |
| dialog restock: SL/Giá | scope `getByRole('dialog')` rồi `.getByLabel(/Số lượng nhập/)`, `.getByLabel(/Giá nhập/)` (label SL có `(${unit})` nội suy → dùng regex) | RestockDialog.tsx | b52fcfb |
| nút xác nhận restock | trong dialog: `getByRole('button',{name:'Xác nhận nhập'})` | RestockDialog.tsx | b52fcfb |
| chi tiết: Tồn / Giá vốn (BQGQ) | text `"40 cái"` / `"175.000 ₫/cái"` (Money nối `formatCurrency(buyPrice)+"/"+unit`) | spare-parts/[id]/page.tsx | b52fcfb |
| toast sau restock | text `"Đã nhập thêm"`; sau tạo mới `"Đã nhập kho"` | RestockDialog.tsx / SparePartForm.tsx | b52fcfb |

### Giao dịch — danh sách & chi tiết
| element | locator | src | verified |
|---|---|---|---|
| dòng giao dịch (theo nội dung) | `getByRole('link').filter({hasText: <tiêu đề = note/counterparty>})`; href `/transactions/<line>/<id>` | transactions/components/TransactionList.tsx | 2026-07-04 |
| field Ghi chú ở chi tiết (bản EDIT, sourceKind=manual) | `getByLabel('Ghi chú')` → assert bằng `toHaveValue(...)` / `inputValue()` (là `<input>`, KHÔNG phải text) | transactions/[line]/[id]/page.tsx, EditTransactionForm.tsx, forms/Field.tsx | 2026-07-04 |
| hàng Ghi chú ở chi tiết (bản READ-ONLY, tự sinh) | `getByText('Ghi chú')` cạnh `<span>{t.note}</span>` — chỉ khi sourceKind≠manual | transactions/[line]/[id]/page.tsx | 2026-07-04 |
| nút Nhập (thêm giao dịch) | `getByRole('link',{name:'Nhập'})` | transactions/[line]/page.tsx | 2026-07-04 |

> Note nhập phụ tùng có SỐ LƯỢNG+ĐƠN VỊ: format `Nhập phụ tùng: <tên> — <n> <đơn vị>` (em dash U+2014, dùng `formatQuantity(qty,unit)` = "n đơn vị"). Vd `... — 5 lít`. Sinh ở spare-parts/actions.ts `restockNote()`.

> Mỗi dòng giao dịch expense trong danh sách hiện tên category ngay dưới giờ
> (vd "09:04 · Vốn hàng · philq"). Giao dịch expense KHÔNG có categoryId (tạo
> tay qua form chung, không qua flow restock) thì KHÔNG có tag này — dấu hiệu
> trực quan để phát hiện giao dịch "Nhập phụ tùng..." bị thiếu category
> `cost_of_goods` (ảnh hưởng công thức Lãi gộp mảng, xem reports.ts). src:
> transactions/components/TransactionList.tsx. verified: 2026-07-04.

### Báo cáo — drill-down links (reports.md §4.5)
| element | locator | src | verified |
|---|---|---|---|
| link "Doanh thu"/"Chi phí" (SummaryCards) | `SUMMARY.filter({hasText:'Thực thu'}).getByRole('link')` / `SUMMARY.filter({hasText:'Gồm giá vốn'}).getByRole('link')` (SUMMARY = `[data-slot="card-content"].p-4`) | SummaryCards.tsx | 2026-07-04 |
| ô "Doanh thu"/"Giá vốn"/"Chi phí mảng" trong hàng mảng | `getByRole('row',{name:/Xe múc\|Thiết bị điện tử\|Phụ kiện/}).locator('td').nth(i)` — thead thứ tự: 0=Mảng,1=Doanh thu,2=Giá vốn,3=Chi phí mảng,4=Lãi gộp; link nếu có nằm trong `td` đó (`.locator('a')`) | GrossProfitSection.tsx | 2026-07-04 |
| tooltip "Giá vốn" không click (xe múc/thiết bị) | `td.locator('span[title]')` — title chứa "Phụ tùng đã xuất kho" (xe múc) / "Tính theo ngày máy được bán" (thiết bị) | GrossProfitSection.tsx (COST_OF_GOODS_TOOLTIP) | 2026-07-04 |
| category row + "chi phí chung" (ExpenseSection) | `getByRole('link').filter({hasText:<tên category>})`; `getByRole('link',{name:'chi phí chung'})` | ExpenseSection.tsx | 2026-07-04 |

### Giao dịch — view tổng hợp `/transactions` (aggregate) & tab nav
| element | locator | src | verified |
|---|---|---|---|
| tab nav | `page.getByRole('navigation',{name:'Chọn mảng giao dịch'})`, các tab `nav.getByRole('link',{name:'Tất cả'\|'Xe múc'\|'Thiết bị điện tử'\|'Phụ kiện'\|'Chi phí chung'})` — LƯU Ý label thiết bị là **"Thiết bị điện tử"**, không phải "Thiết bị" | TransactionLineTabs.tsx | 2026-07-04 |
| badge "Mảng" mỗi dòng (chỉ aggregate) | trong `<li>` dòng giao dịch, span có text = `businessLineLabel(t.businessLine)` ("Xe múc"/"Thiết bị điện tử"/"Phụ kiện"/"Chung") | TransactionList.tsx (aggregate=true) | 2026-07-04 |
| nút "Nhập" — PHẢI KHÔNG có ở aggregate | `getByRole('link',{name:'Nhập',exact:true})` toHaveCount(0) — **bắt buộc exact:true**, xem ERROR.md (nhiều dòng "Nhập phụ tùng: ..." chứa substring "Nhập") | transactions/page.tsx (không render Link Nhập) | 2026-07-04 |
| empty-state aggregate (0 giao dịch) | text `"Chưa có giao dịch nào trong khoảng lọc này."` (KHÁC bản theo-mảng: `"Chưa có giao dịch nào. Bấm Nhập để thêm dòng đầu tiên."`) | TransactionList.tsx (aggregate ? ... : ...) | 2026-07-04 |
| hidden input categoryId/excludeCategoryId trong filter form | `page.locator('input[name="categoryId"]')` / `input[name="excludeCategoryId"]` — chỉ render khi `params.categoryId`/`excludeCategoryId` có giá trị | TransactionFilters.tsx | 2026-07-04 |
| toggle "Bộ lọc" (chỉ mobile, ẩn ở desktop `sm:hidden`) | `getByRole('button',{name:/Bộ lọc/})` — PHẢI click để lộ select/date trước khi thao tác trên mobile; label đổi thành `"Bộ lọc (N đang bật)"` khi có filter khác mặc định → dùng regex, KHÔNG dùng name chính xác `'Lọc'` (trùng substring với nút submit, xem ERROR.md) | components/filters/FilterBar.tsx | 2026-07-04 |
| nút submit filter thật | `getByRole('button',{name:'Lọc',exact:true})` | TransactionFilters.tsx | 2026-07-04 |

### BottomNav (mobile only, `sm:hidden`)
| element | locator | src | verified |
|---|---|---|---|
| container nav | `page.getByRole('navigation',{name:'Điều hướng'})` | BottomNav.tsx (`aria-label="Điều hướng"`) | 2026-07-04 |
| 4 tab thường | `nav.getByRole('link',{name:'Tổng quan'\|'Giao dịch'\|'Công nợ'\|'Kho'})`; active có `aria-current="page"` | BottomNav.tsx (TabLink) | 2026-07-04 |
| FAB (nút giữa) | `nav.getByRole('button',{name:'Nhập giao dịch'})` (ở `/`, là `<button>`) HOẶC `nav.getByRole('button' hoặc MenuTrigger,{name:'Nhập giao dịch'})` (trang khác, là `MenuTrigger` — cùng accessible name nên 1 locator dùng được cả 2 trạng thái) | BottomNav.tsx | 2026-07-04 |
| dialog nhập nhanh (chỉ mở được ở `/`) | `page.getByRole('dialog')` + `page.getByRole('heading',{name:'Nhập giao dịch nhanh'})` | dashboard/QuickEntryDialog.tsx | 2026-07-04 |
| menu điều hướng nhập (mở ở trang khác `/`) | `page.getByRole('menu')`, item `page.getByRole('menuitem',{name:...})` — **PHẢI `exact:true` cho "Xe múc"** (khớp nhầm "Job sửa xe múc"), xem ERROR.md | BottomNav.tsx | 2026-07-04 |

### Báo cáo — footnote giải thích công thức (đã có sẵn trên UI)
- Dưới bảng "Lãi gộp từng mảng": *"Giá vốn: xe múc = phụ tùng đã xuất; thiết
  bị = tiền mua máy đã bán; phụ kiện = chi nhập hàng. Chi phí mảng không gồm
  giá vốn và chi phí chung."*
- Dưới "Chi phí theo danh mục": *"Trong đó chi phí chung (không thuộc mảng
  nào): X ₫ — không phân bổ vào lãi gộp mảng."*
- Dưới "Xu hướng 12 tháng": *"Lãi = doanh thu − toàn bộ chi phí theo tháng
  (accrual), cùng cách tính với thẻ tổng quan — khác lãi gộp từng mảng."*
- src: src/app/(dashboard)/reports/components/GrossProfitSection.tsx, ExpenseByCategorySection.tsx (hoặc tương đương), MonthlyTrendSection.tsx. verified: 2026-07-04.
