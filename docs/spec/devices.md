# Spec — Thiết bị điện tử (Devices)

> **Loại:** spec nghiệp vụ mảng **thiết bị điện tử** (`thiet_bi`).
> **Tham chiếu:** [business-overview.md](../business-overview.md), [architecture.md](../architecture.md), [transactions-and-debts.md](./transactions-and-debts.md), [expenses.md](./expenses.md), [accessories.md](./accessories.md).

---

## 1. Mục đích & phạm vi

Quản lý mua bán máy cũ (điện thoại, laptop, PC): nhập máy vào kho, bán ra ăn chênh lệch. Kèm hai nguồn thu phụ: **sửa chữa nhỏ** (thu tiền công) và **bán phụ kiện lẻ** — ghi như giao dịch income của mảng, không gắn device.

---

## 2. Mô hình dữ liệu

### 2.1. `devices` (kho máy)

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | pk | |
| `name` | text | Tên máy |
| `condition_note` | text | Tình trạng / ghi chú |
| `buy_price` | numeric | Giá mua vào |
| `buy_date` | date | |
| `buy_from` | text | Nguồn mua |
| `sell_price` | numeric, nullable | Giá bán (null khi chưa bán) |
| `sell_date` | date, nullable | |
| `status` | enum `in_stock` \| `sold` | |
| `buy_transaction_id` | fk → transactions | Giao dịch chi khi mua |
| `sell_transaction_id` | fk → transactions, nullable | Giao dịch thu khi bán |

> Sửa chữa nhỏ & phụ kiện lẻ **không** có bảng riêng — là `transaction` income mảng `thiet_bi` (xem [accessories.md](./accessories.md) cho phụ kiện lẻ, hoặc nhập trực tiếp ở màn giao dịch mảng).

---

## 3. Quy tắc nghiệp vụ

### 3.1. Mua máy vào
- Tạo `device` với `status = in_stock`, giá mua, ngày, nguồn, tình trạng.
- **Sinh 1 transaction expense** (`category = cost_of_goods`, `business_line = thiet_bi`, `amount = buy_price`) → trả sau thì sinh công nợ `payable`. Gắn `buy_transaction_id`.

### 3.2. Bán máy ra
- Cập nhật `sell_price`, `sell_date`, `status = sold`.
- **Sinh 1 transaction income** (`business_line = thiet_bi`, `amount = sell_price`, `paid_amount` theo thực thu) → trả sau thì sinh công nợ `receivable`. Gắn `sell_transaction_id`.

### 3.3. Lãi một máy
`lãi = sell_price − buy_price`. Có thể **âm** (bán lỗ) — hợp lệ.
Chi phí sửa chữa trước khi bán **không** gắn vào lãi từng máy ở giai đoạn này (chốt ở mục 8.1); chúng được trừ ở **lãi gộp mảng** (xem [reports.md](./reports.md)). Vì vậy công thức trên là lãi từng máy **chính thức** của giai đoạn này, không phải tạm tính.

---

## 4. Nhập liệu

- Kho máy: `/devices` (danh sách + lọc in_stock/sold), `/devices/new` (nhập máy), `/devices/[id]` (chi tiết + thao tác **bán ra**). Xem [screens.md](./screens.md).
- Sửa chữa nhỏ / phụ kiện lẻ: nhập tại màn giao dịch mảng `/transactions/thiet-bi`.

---

## 5. Báo cáo liên quan

- **Tồn kho máy chưa bán**: `devices` `status = in_stock` (vốn đang nằm trong kho = Σ buy_price).
- Lãi gộp mảng thiết bị: Σ(sell − buy) máy đã bán + thu sửa chữa/phụ kiện − chi phí mảng (xem [reports.md](./reports.md)).

---

## 6. Phụ thuộc

1. [transactions-and-debts.md](./transactions-and-debts.md) — mua sinh expense, bán sinh income, trả sau → công nợ.
2. [expenses.md](./expenses.md) — mua máy = expense `cost_of_goods`.
3. Màn `/devices` ([screens.md](./screens.md)).

---

## 7. Acceptance criteria

- [ ] Nhập máy → `device` in_stock + expense `cost_of_goods` / `thiet_bi` = giá mua.
- [ ] Bán máy → `status=sold`, income = giá bán; trả sau → công nợ `receivable`.
- [ ] Lãi máy = giá bán − giá mua.
- [ ] Báo cáo tồn kho liệt kê đúng máy chưa bán + tổng vốn tồn.
- [ ] Thu sửa chữa nhỏ ghi vào mảng thiết bị mà không cần device.

---

## 8. Điểm chưa chốt

1. **Gắn chi phí sửa chữa cho từng máy**: hiện sửa-trước-khi-bán không gắn vào lãi của máy cụ thể (chỉ trừ ở lãi mảng tổng). Có cần liên kết chi phí ↔ device để tính lãi từng máy chính xác? → tạm **không**.
2. **Hoàn tác bán** (khách trả lại máy): chốt cơ chế đảo `status` + huỷ income.
3. **Phụ kiện lẻ thuộc mảng thiết bị hay mảng phụ kiện**: ranh giới với [accessories.md](./accessories.md) — đề xuất phụ kiện bán kèm máy ghi mảng `thiet_bi`, bán lẻ độc lập ghi `phu_kien`.
