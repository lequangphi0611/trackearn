# Spec màn hình — Báo cáo (`/reports`)

> **Loại:** spec chi tiết màn báo cáo phân tích (read-only, **owner only**).
> **Tham chiếu:** [../screens.md](../screens.md), [reports.md](../reports.md) (nghiệp vụ báo cáo), [transactions-and-debts.md](../transactions-and-debts.md), [expenses.md](../expenses.md), [devices.md](../devices.md), [repair-jobs.md](../repair-jobs.md), [middleware.md](../middleware.md), [coding-rules](../../coding-rules.md).
> **Quyết định nền:** **accrual** (theo `amount`) kèm chỉ số "thực thu" (`paid_amount`); timezone `Asia/Ho_Chi_Minh`; chi phí chung **không** phân bổ vào mảng.
> **Lưu ý:** màn này owner chọn mức trực quan **đầy đủ** (biểu đồ + xu hướng nhiều tháng) — cao hơn mặt bằng MVP của các màn nhập liệu.

---

## 1. Mục đích & phạm vi

Cung cấp cho **chủ hộ** bức tranh tài chính theo kỳ để ra quyết định: doanh thu/chi phí/lãi, lãi gộp từng mảng, chi phí tốn nhất, và xu hướng nhiều tháng. **Read-only**, không phát sinh dữ liệu.

(Báo cáo **trong ngày** nằm ở dashboard — xem [screens/dashboard.md](./dashboard.md). Màn này là báo cáo **theo kỳ**.)

---

## 2. Route & quyền

| Thuộc tính | Giá trị |
|------------|---------|
| Route | `/reports` (URL state `?period=month\|quarter\|year&date=YYYY-MM-DD`) |
| Thư mục | `src/app/(dashboard)/reports/page.tsx` |
| Quyền | **owner only** |
| Chặn | Server component lấy session; `role !== "owner"` → `redirect("/")` (xem [middleware.md](../middleware.md) §5) |

---

## 3. Chọn kỳ

- **Loại kỳ**: Tháng / Quý / Năm (mặc định **Tháng**). **Kỳ hiện tại** mặc định theo hôm nay (VN).
- Đổi kỳ qua URL state (`?period=&date=`) → server re-fetch. Ranh giới kỳ theo timezone VN.
- **"Kỳ trước"** = kỳ liền trước **cùng loại** (tháng trước / quý trước / năm trước) để so sánh.

---

## 4. Nội dung & biểu đồ

### 4.1. Tổng quan kỳ (cards)
- **Doanh thu** (Σ `amount` income), **Chi phí** (Σ `amount` **toàn bộ** expense — gồm cả giá vốn `cost_of_goods` và chi phí chung), **Lãi** (doanh thu − chi phí) — accrual; kèm **"thực thu"** (Σ `paid_amount` income).
  - ⚠️ "Chi phí" tổng ở card này **khác** "chi phí mảng" ở lãi gộp (4.2) — card là tổng mọi expense, "chi phí mảng" loại trừ giá vốn & chi phí chung.
- **So sánh kỳ trước**: % thay đổi **doanh thu, chi phí, lãi**. Kỳ trước = 0 → hiển thị **"—"** (không chia 0).

### 4.2. Lãi gộp từng mảng (bảng + bar)
Cho mỗi `business_line` trong kỳ (công thức từ [reports.md](../reports.md) §3.2):

| Mảng | Lãi gộp |
|------|---------|
| Xe múc | Σ income job − Σ giá vốn phụ tùng xuất (`cost_price`) − chi phí mảng |
| Thiết bị | Σ(sell − buy) máy bán trong kỳ + thu sửa/phụ kiện − chi phí mảng |
| Phụ kiện | Σ income − Σ chi phí nhập − chi phí mảng |

- **"Chi phí mảng"** = expense có `business_line_id` = mảng đó (không gồm `cost_of_goods` đã trừ dạng giá vốn, không gồm chi phí chung).
- Biểu đồ **bar** so sánh lãi gộp 3 mảng.

### 4.3. Chi phí theo danh mục (bar)
- `GROUP BY category_id` trên **toàn bộ** expense trong kỳ (gồm cả chi phí chung) → Σ `amount`, **sắp xếp giảm dần** (tốn nhất trước). Bar ngang. Đây là góc nhìn **theo loại chi phí**.
- **Chi phí chung** (`business_line_id = NULL`) hiển thị thêm như **chỉ số bổ sung** (góc nhìn theo mảng: bao nhiêu tiền không thuộc mảng nào), **không** phân bổ vào mảng và **không** trừ khỏi nhóm theo danh mục ở trên (tránh đếm hai lần).

### 4.4. Xu hướng nhiều tháng (line)
- Biểu đồ **line**: doanh thu & lãi theo **tháng**, **12 tháng gần nhất** (độc lập với loại kỳ đang chọn) → thấy xu hướng.

### 4.5. Drill-down sang giao dịch (click xem chi tiết)

> **Mục tiêu**: người xem báo cáo bấm vào một con số → mở đúng danh sách giao dịch cấu thành số đó ở [`/transactions`](./transactions.md). **Bắt buộc khớp tuyệt đối** giữa số trên báo cáo và tổng số trên danh sách lọc ra — nếu một số liệu không thể đảm bảo khớp tuyệt đối (khác nguồn dữ liệu, khác mốc ngày), số đó **không được click**.

**Ánh xạ kỳ → khoảng ngày**: `from`/`to` truyền sang `/transactions` lấy từ đúng **kỳ đang xem** trên báo cáo (không phải kỳ trước), tính theo cùng biên kỳ VN (`vnPeriodRange`) đã dùng để tính số liệu; `to` truyền dạng ngày cuối kỳ **inclusive** (cùng quy ước `/transactions/[line]` đang dùng).

Số nào click được, số nào không, và điều hướng tới đâu:

| Vị trí | Số liệu | Click? | Điều hướng |
|--------|---------|--------|------------|
| 4.1 Tổng quan | Doanh thu (tổng, cả kỳ) | ✅ | `/transactions?type=income&from=&to=` |
| 4.1 Tổng quan | Chi phí (tổng, cả kỳ — gồm giá vốn + chi phí chung) | ✅ | `/transactions?type=expense&from=&to=` |
| 4.1 Tổng quan | Lãi | ❌ | hiệu số Doanh thu − Chi phí, không phải tổng của 1 danh sách |
| 4.1 Tổng quan | Thực thu (`paid_amount`) | ❌ | ngoài phạm vi — xem §8 Điểm chưa chốt |
| 4.2 Lãi gộp mảng | Doanh thu (theo từng mảng) | ✅ | `/transactions/<mảng>?type=income&from=&to=` |
| 4.2 Lãi gộp mảng | Chi phí mảng (đã loại giá vốn) | ✅ | `/transactions/<mảng>?type=expense&excludeCategoryId=<id "cost_of_goods">&from=&to=` |
| 4.2 Lãi gộp mảng | Giá vốn — Xe múc | ❌ | phụ tùng xuất kho (`repair_job_parts`), **không phải** `transactions` — không có gì để click ra |
| 4.2 Lãi gộp mảng | Giá vốn — Thiết bị | ❌ | tính theo `sell_date` của máy **bán trong kỳ**, KHÔNG theo `transacted_at` của giao dịch mua (máy có thể mua từ kỳ trước) → lọc `/transactions` theo khoảng ngày sẽ ra sai số |
| 4.2 Lãi gộp mảng | Giá vốn — Phụ kiện | ✅ | `/transactions/phu-kien?type=expense&categoryId=<id "cost_of_goods">&from=&to=` |
| 4.2 Lãi gộp mảng | Lãi gộp (theo mảng) | ❌ | tổng hợp nhiều thành phần khác nguồn, không map 1-1 với 1 danh sách |
| 4.3 Chi phí danh mục | Từng cột danh mục (trong top 10) | ✅ | `/transactions?type=expense&categoryId=<id>&from=&to=` (xuyên mảng) |
| 4.3 Chi phí danh mục | Cột "Còn lại (gộp)" | ❌ | gộp nhiều danh mục, không có 1 `categoryId` để lọc đúng |
| 4.3 Chi phí danh mục | "Chi phí chung" (chỉ số phụ) | ✅ | `/transactions/chi-phi-chung?from=&to=` |
| 4.4 Xu hướng | Điểm trên biểu đồ | ❌ | ngoài phạm vi — xem §8 Điểm chưa chốt |

- **Ô không click được** vẫn hiển thị số bình thường (không phải link, không đổi màu/hover); có thể kèm ghi chú/tooltip ngắn giải thích lý do (vd "phụ tùng đã xuất — xem ở màn Phụ tùng", "tính theo ngày máy được bán, không theo ngày mua").
- `categoryId` / `excludeCategoryId` nhận **id thật** (uuid) của danh mục `cost_of_goods`, do server component báo cáo tự tra cứu khi dựng link — không phải slug gõ tay.
- Xem cập nhật bộ lọc tương ứng ở [screens/transactions.md](./transactions.md) §3.2 và §9 (view tổng hợp nhiều mảng).

---

## 5. Trực quan hóa (chart)

- Dùng **thư viện chart** (vd Recharts) trong **client component island**; dữ liệu tính sẵn ở server, truyền xuống dạng JSON gọn. Phần khung trang render server.
- Mobile-first: biểu đồ co giãn theo bề ngang, có nhãn số rõ.

---

## 6. Dữ liệu & nguồn (queries)

Server Component fetch qua Drizzle (`src/queries/`):

| Query | Dùng cho |
|-------|----------|
| `getPeriodSummary(period, date)` | 4.1 — doanh thu/chi phí/lãi/thực thu + kỳ trước |
| `getGrossProfitByLine(period, date)` | 4.2 |
| `getExpenseByCategory(period, date)` | 4.3 (+ chi phí chung) |
| `getMonthlyTrend(12)` | 4.4 |

- Mốc kỳ tính theo VN; tất cả số theo accrual (`amount`).

---

## 7. Acceptance criteria

- [ ] Chỉ owner vào được; member bị server redirect `/`.
- [ ] Chọn được kỳ Tháng/Quý/Năm; đổi kỳ → toàn bộ số liệu + biểu đồ cập nhật.
- [ ] Tổng quan hiện doanh thu/chi phí/lãi (accrual) + thực thu + % so kỳ trước; kỳ trước = 0 → "—".
- [ ] Lãi gộp 3 mảng đúng công thức (xe múc dùng `cost_price`); có bar so sánh.
- [ ] Chi phí theo danh mục sắp xếp giảm dần + mục "Chi phí chung" riêng.
- [ ] Biểu đồ xu hướng 12 tháng (doanh thu & lãi).
- [ ] Mốc thời gian theo `Asia/Ho_Chi_Minh`.
- [ ] Các ô có ✅ ở bảng §4.5 là link; bấm vào mở đúng `/transactions` (hoặc `/transactions/<mảng>`) với `type`/`from`/`to`/`categoryId`/`excludeCategoryId` tương ứng.
- [ ] Tổng số tiền trên danh sách giao dịch lọc ra **khớp tuyệt đối** với số đã click trên báo cáo (cùng khoảng ngày, cùng loại, cùng danh mục nếu có).
- [ ] Các ô có ❌ ở bảng §4.5 (Lãi, Thực thu, Giá vốn xe múc/thiết bị, cột "Còn lại", điểm xu hướng) hiển thị bình thường, không phải link.

---

## 8. Điểm chưa chốt

1. **Xuất báo cáo** (PDF/CSV) để in/gửi → để mở, ngoài MVP.
2. **Phân bổ chi phí chung vào mảng** (theo tỉ lệ doanh thu) cho lãi mảng "sạch" hơn → hiện **không** (đã chốt ở expenses); xem lại nếu cần.
3. **Lọc xu hướng theo mảng** (line riêng từng mảng) → để mở; hiện xu hướng tổng.
4. **Drill-down "Thực thu"** (`paid_amount`) và **điểm trên biểu đồ xu hướng** → để mở, ngoài phạm vi lần này (xem §4.5).
5. **Drill-down "Giá vốn" xe múc/thiết bị** → hiện không click được vì khác nguồn dữ liệu/mốc ngày (xem §4.5). Muốn xem chi tiết, cân nhắc thêm sau: filter theo `sell_date` ở màn Kho thiết bị, hoặc màn xem phụ tùng đã xuất theo kỳ cho xe múc — cả hai đều ngoài phạm vi lần này.
