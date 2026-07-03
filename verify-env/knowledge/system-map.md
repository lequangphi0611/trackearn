# system-map — bản đồ điều hướng app TrackEarn

Chỉ mục để trả lời "cần vào màn hình / route nào để test X". Đổi chậm → ít stale.
Skill `verify-app` đọc file này trước khi grep source. Bổ sung dần mỗi lần verify.

## Format mỗi entry

```
### <Tên màn hình / chức năng>
- route: <đường dẫn URL, vd /dashboard>
- mô tả: <chức năng chính, 1 dòng>
- đi tới từ: <màn hình/nút dẫn vào đây>
- đi tới: <các màn hình đi ra>
- src: <file source chính, vd src/app/(dashboard)/page.tsx>
- verified: <commit hash ngắn hoặc ngày lần cuối xác nhận>
```

> Trước khi tin một entry, áp GIAO THỨC FRESHNESS trong SKILL.md: nếu `src` đã đổi
> kể từ `verified` → đọc lại source, cập nhật entry.

---

### Báo cáo (Reports)
- route: `/reports` — nhận `?period=month|quarter|year&date=YYYY-MM-DD`
- mô tả: báo cáo theo kỳ (owner only): 3 card tổng quan (Doanh thu/Chi phí/Lãi + % so kỳ trước), bảng Lãi gộp từng mảng, Chi phí theo danh mục, Xu hướng 12 tháng.
- đi tới từ: BottomNav / DashboardNav (owner)
- đi tới: chỉ đổi state qua URL (period/date), không điều hướng đi màn khác
- gác quyền: server component redirect `/` nếu role !== owner, `/login` nếu chưa đăng nhập
- src: src/app/(dashboard)/reports/page.tsx, src/queries/reports.ts, src/lib/date.ts (vnPeriodRange/vnPeriodShift), src/lib/format.ts (formatPercentChange)
- verified: b52fcfb

### Thêm phụ tùng mới (Spare part — new)
- route: `/spare-parts/new`
- mô tả: form tạo phụ tùng: Tên, Đơn vị, Số lượng nhập, Giá nhập/đv, Ngưỡng cảnh báo. Submit → action `createOrRestockSparePart`; nếu trùng tên (ilike) thì cộng dồn BQGQ thay vì tạo mới. Thành công → push `/spare-parts/<id>`.
- đi tới từ: /spare-parts (nút thêm), BottomNav → Kho
- đi tới: /spare-parts/<id> (sau khi lưu)
- src: src/app/(dashboard)/spare-parts/components/SparePartForm.tsx, spare-parts/actions.ts, spare-parts/schema.ts
- verified: b52fcfb

### Chi tiết phụ tùng + Nhập thêm/BQGQ (Spare part detail)
- route: `/spare-parts/[id]`
- mô tả: hiện Tồn hiện tại, "Giá vốn (BQGQ)", Ngưỡng. Nút "Nhập thêm" mở dialog restock (Số lượng + Giá nhập) → action `restockSparePart` cập nhật tồn + giá vốn bình quân gia quyền + sinh expense cost_of_goods/xe_muc. Nút "Kiểm kê" (AdjustStockDialog) đặt lại tồn (không sinh expense).
- đi tới từ: /spare-parts/new (sau lưu), danh sách /spare-parts
- đi tới: ở lại trang (router.refresh sau restock)
- src: src/app/(dashboard)/spare-parts/[id]/page.tsx, spare-parts/components/RestockDialog.tsx, spare-parts/actions.ts (weightedBuyPrice/applyRestock)
- verified: b52fcfb
