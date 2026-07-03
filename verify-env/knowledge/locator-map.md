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
