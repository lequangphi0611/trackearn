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

---

## 8. Điểm chưa chốt

1. **Xuất báo cáo** (PDF/CSV) để in/gửi → để mở, ngoài MVP.
2. **Phân bổ chi phí chung vào mảng** (theo tỉ lệ doanh thu) cho lãi mảng "sạch" hơn → hiện **không** (đã chốt ở expenses); xem lại nếu cần.
3. **Lọc xu hướng theo mảng** (line riêng từng mảng) → để mở; hiện xu hướng tổng.
