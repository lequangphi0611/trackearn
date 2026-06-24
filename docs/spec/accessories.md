# Spec — Phụ kiện (Accessories)

> **Loại:** spec nghiệp vụ mảng **phụ kiện** (`phu_kien`).
> **Tham chiếu:** [business-overview.md](../business-overview.md), [architecture.md](../architecture.md), [transactions-and-debts.md](./transactions-and-debts.md), [expenses.md](./expenses.md).

---

## 1. Mục đích & phạm vi

Mảng đơn giản nhất: **bán lẻ phụ kiện** (ốp lưng, cáp, pin…). Theo business-overview, mảng này "đơn giản" — **không quản lý tồn kho chi tiết** (khác devices/spare_parts). Chỉ ghi nhận giao dịch bán và chi phí nhập hàng.

---

## 2. Mô hình dữ liệu

**Không có bảng riêng.** Toàn bộ quy về `transactions` mảng `phu_kien`:

| Hoạt động | transaction |
|-----------|-------------|
| Bán phụ kiện | `type = income`, `business_line = phu_kien`, `amount` = tiền bán |
| Nhập phụ kiện về | `type = expense`, `category = cost_of_goods`, `business_line = phu_kien` |

> Không có bảng kho phụ kiện → không theo dõi tồn từng món. `note` ghi mô tả món bán nếu cần.

---

## 3. Quy tắc nghiệp vụ

- **Bán**: tạo transaction income, `paid_amount` theo thực thu → trả sau sinh công nợ `receivable` (xem [transactions-and-debts.md](./transactions-and-debts.md)).
- **Nhập hàng**: tạo transaction expense `cost_of_goods` (xem [expenses.md](./expenses.md)).
- Lãi gộp mảng = Σ income bán − Σ chi phí nhập − chi phí khác của mảng (gần đúng, do không tính giá vốn theo từng món).

---

## 4. Nhập liệu

- `/transactions/phu-kien` — danh sách + nhập nhanh (income bán / expense nhập). Xem [screens.md](./screens.md).
- Không có màn kho riêng.

---

## 5. Báo cáo liên quan

- Doanh thu & lãi gộp mảng phụ kiện (xem [reports.md](./reports.md)).
- **Không** có báo cáo tồn kho phụ kiện (vì không quản lý kho).

---

## 6. Phụ thuộc

1. [transactions-and-debts.md](./transactions-and-debts.md) — bán/nhập sinh transaction, trả sau → công nợ.
2. [expenses.md](./expenses.md) — nhập hàng = expense `cost_of_goods` / `phu_kien`.
3. Màn `/transactions/phu-kien` ([screens.md](./screens.md)).

---

## 7. Acceptance criteria

- [ ] Bán phụ kiện → income mảng `phu_kien`; trả sau → công nợ `receivable`.
- [ ] Nhập hàng phụ kiện → expense `cost_of_goods` / `phu_kien`.
- [ ] Lãi gộp mảng = thu bán − chi nhập − chi phí khác mảng.
- [ ] Không yêu cầu bảng/màn kho phụ kiện.

---

## 8. Quyết định đã chốt

1. **Quản lý tồn kho phụ kiện**: **không** — chỉ ghi giao dịch bán/nhập, không bảng kho, không giá vốn từng món (MVP). Có thể thêm bảng như `spare_parts` sau nếu cần.
2. **Ranh giới với phụ kiện bán kèm máy**: bán **kèm máy** → mảng `thiet_bi`; bán **lẻ độc lập** → mảng `phu_kien` (xem [devices.md](./devices.md)).
