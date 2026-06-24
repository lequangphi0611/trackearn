# Spec màn hình — Công nợ (`/debts`)

> **Loại:** spec chi tiết màn công nợ, đầu bài cho AI/dev implement.
> **Tham chiếu:** [../screens.md](../screens.md), [transactions-and-debts.md](../transactions-and-debts.md) (model & quy tắc), [coding-rules](../../coding-rules.md).
> **Quyết định nền:** `debt.paid` là nguồn chân lý; tất toán khi `paid >= total`; khách trả dư → **tip** (income riêng); chỉ lưu **tổng** đã trả (không lịch sử từng đợt).

---

## 1. Mục đích & phạm vi

Theo dõi và tất toán công nợ phát sinh khi giao dịch **trả sau** (mọi mảng). Hai chiều:
- **receivable** — khách nợ mình (từ income trả sau).
- **payable** — mình nợ nhà cung cấp (từ expense trả sau).

2 route: **danh sách** (`/debts`), **chi tiết** (`/debts/[id]`). Quyền: owner + member.

---

## 2. Màn danh sách (`/debts`)

### 2.1. Hai tab theo chiều
- **Tab "Khách nợ mình"** (`receivable`) và **Tab "Mình nợ"** (`payable`). Tab chọn qua URL state (`?dir=receivable|payable`, mặc định `receivable`).
- Mỗi tab hiển thị **tổng còn lại** = Σ(`total − paid`) của các công nợ **chưa tất toán** trong tab (luôn tính trên khoản chưa tất toán, **không** đổi theo bộ lọc trạng thái).

### 2.2. Cột
Tên đối tác (`counterparty_name`), còn lại (`total − paid`), đã trả / tổng, ngày hẹn (`due_date`), **badge "Quá hạn"** (nếu `due_date <` ngày thực & chưa tất toán), mảng/giao dịch gốc (link).

### 2.3. Bộ lọc (URL state `?dir=&status=&overdue=&q=&page=`)
- **Trạng thái tất toán**: chưa tất toán (mặc định) / đã tất toán / tất cả.
- **Quá hạn**: chỉ hiện khoản quá hạn (`due_date <` ngày thực, chưa `settled_at`).
- **Tìm đối tác** (`q`): `counterparty_name`.
- Tải: nút "Xem thêm" 20 dòng; sắp xếp **gần đến hạn / quá hạn lên trước**, rồi mới nhất.

> **Mốc thời gian & due_date:** "ngày thực" = ngày hiện tại theo `Asia/Ho_Chi_Minh`. `due_date` **nullable** (có thể không hẹn ngày) → khoản không có `due_date` **không** tính quá hạn và xếp **cuối** nhóm.

---

## 3. Màn chi tiết (`/debts/[id]`)

### 3.1. Hiển thị
Đối tác, chiều (receivable/payable), `total`, `paid`, **còn lại** (`total − paid`), `due_date`, `settled_at` (nếu đã tất toán), badge quá hạn. Link tới **giao dịch gốc** (`transaction_id`) — chỉ đọc.

### 3.2. Dialog "Ghi nhận trả"
Nút **"Ghi nhận trả"** (ẩn khi đã tất toán) → dialog:

| Trường | Ràng buộc |
|--------|-----------|
| `amount_paid` | > 0 |
| `paid_date` | mặc định hôm nay (VN) |

**Khi xác nhận** (theo [transactions-and-debts.md](../transactions-and-debts.md) §3.3–3.4):
- Cộng `debt.paid += amount_paid`; đồng bộ `transaction.paid_amount`; tính lại `payment_status`.
- `paid >= total` → set `settled_at` (= `paid_date` của lần trả này), `payment_status = paid`.
- `paid_date` dùng làm mốc `settled_at` khi tất toán; vì **không lưu lịch sử từng đợt** (chỉ tổng `paid`), từng lần trả riêng lẻ không persist.
- **receivable**: nếu `amount_paid` **vượt phần còn lại** (`total − paid`) → công nợ tất toán đúng `total`, **phần vượt thành tip** (income riêng, gắn mảng giao dịch gốc — §3.4).
- **payable**: **chặn** `amount_paid > còn lại` (mình không trả NCC dư) — validate báo lỗi.

### 3.3. Thao tác khác
- **Sửa `due_date`** / `counterparty_name` (đính chính). Không sửa `total` ở đây (sửa ở giao dịch gốc).
- Không xoá công nợ trực tiếp — công nợ gắn vòng đời giao dịch gốc.

---

## 4. Quan hệ giao dịch gốc

- Mỗi công nợ ↔ 1 `transaction` (`transaction_id`). Giao dịch gốc hiển thị **chỉ đọc** với link; chỉnh số tiền/huỷ làm ở giao dịch gốc (hoặc màn nguồn nếu là giao dịch tự sinh).

---

## 5. Phụ thuộc

1. [transactions-and-debts.md](../transactions-and-debts.md) — model `debts`, quy tắc ghi nhận trả, tip.
2. Giao dịch gốc: [screens/transactions.md](./transactions.md), [devices.md](./devices.md), [repair-jobs.md](./repair-jobs.md).

---

## 6. Acceptance criteria

- [ ] 2 tab receivable/payable; mỗi tab hiện tổng còn lại đúng.
- [ ] Lọc được: trạng thái tất toán (mặc định chưa tất toán), chỉ quá hạn, tìm đối tác.
- [ ] Khoản quá hạn có badge; sắp xếp quá hạn/gần hạn lên trước.
- [ ] Ghi nhận trả → cộng `paid`, đồng bộ `transaction.paid_amount`, cập nhật trạng thái; trả đủ → `settled_at`.
- [ ] receivable trả dư → tất toán đúng `total` + sinh tip income đúng mảng; payable bị chặn trả quá còn lại.
- [ ] Link giao dịch gốc chỉ đọc, đúng giao dịch.

---

## 7. Điểm chưa chốt

1. **Lịch sử từng đợt trả**: hiện chỉ tổng `paid` (đã chốt). Nếu cần đối soát chi tiết → thêm `debt_payments` sau.
2. **Nhắc hạn**: thông báo/đánh dấu khoản sắp đến hạn (vd còn 3 ngày) → để mở, ngoài MVP.
