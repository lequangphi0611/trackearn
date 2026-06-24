# Spec — Giao dịch & Công nợ (Transactions & Debts)

> **Loại:** spec nghiệp vụ + data model nền tảng — backbone tài chính cho cả 3 mảng.
> **Tham chiếu:** [business-overview.md](../business-overview.md), [architecture.md](../architecture.md), [expenses.md](./expenses.md).

---

## 1. Mục đích & phạm vi

Định nghĩa **đơn vị tài chính chung** của toàn app: mọi dòng tiền (thu/chi) của cả 3 mảng đều là một `transaction`. Khi trả sau → sinh `debt` (công nợ).

Mọi luồng nghiệp vụ (bán device, job sửa xe, bán phụ kiện, chi phí…) **đều quy về `transaction`** — các spec mảng chỉ mô tả cách *sinh ra* transaction.

---

## 2. Mô hình dữ liệu

### 2.1. `transactions`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | pk | |
| `type` | enum `income` \| `expense` | |
| `amount` | numeric | Tổng tiền của giao dịch |
| `paid_amount` | numeric | Đã thu/đã trả thực tế (≤ `amount`) |
| `payment_status` | enum `paid` \| `partial` \| `pending` | **Suy ra** từ `paid_amount` (mục 3.1) |
| `business_line_id` | fk, **nullable** | `xe_muc`/`thiet_bi`/`phu_kien`; NULL = chi phí chung |
| `category_id` | fk → `expense_categories`, nullable | Chỉ expense; xem [expenses.md](./expenses.md) |
| `user_id` | fk → user, **NOT NULL** | **Người tạo** (người nhập / thực hiện); giao dịch tự sinh = người thao tác nguồn (tạo job / bán máy) |
| `source_kind` | enum `manual`\|`repair_job`\|`device_buy`\|`device_sell` | `manual` = nhập tay (sửa được); còn lại = tự sinh (khoá sửa) |
| `source_id` | nullable | id bản ghi nguồn (job/device) để dựng link; NULL khi `manual` |
| `note` | text | |
| `transacted_at` | timestamp | **Ngày giao dịch** (thời điểm phát sinh; mặc định now nhưng **sửa được** — vd nhập lùi ngày) |
| `created_at` | timestamp | **Mốc tạo bản ghi** (audit, **không sửa**, mặc định now) — khác `transacted_at` |
| `updated_at` | timestamp | Mốc sửa gần nhất (cập nhật mỗi lần sửa) |
| `updated_by` | fk → user, nullable | Người sửa gần nhất; NULL nếu chưa sửa lần nào |

> **`transacted_at` vs `created_at`**: `transacted_at` là ngày *nghiệp vụ* của giao dịch (có thể lùi về quá khứ); `created_at` là mốc *thực tế* bản ghi được tạo trong hệ thống (audit, bất biến). Báo cáo/lọc theo ngày dùng `transacted_at`; truy vết "ai tạo lúc nào" dùng `user_id` + `created_at`.
> Quy ước audit (`created_at`/`updated_at`/`updated_by`) áp dụng tương tự cho các bảng nghiệp vụ khác (devices, repair_jobs, spare_parts, debts…).
> **Chi tiết audit:** lúc tạo, `updated_at = created_at` và `updated_by = NULL`. Mọi thao tác làm đổi bản ghi — kể cả **ghi nhận trả nợ** (đổi `paid_amount`/`payment_status`) — đều set `updated_at = now`, `updated_by` = người thực hiện. Giao dịch tự sinh: `created_at = now` lúc tạo job/bán máy.

### 2.2. `debts`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | pk | |
| `transaction_id` | fk → transactions, unique | 1 giao dịch ↔ tối đa 1 công nợ |
| `direction` | enum `receivable` \| `payable` | Suy ra từ `transaction.type` (mục 3.2) |
| `counterparty_name` | text | Tên người nợ / chủ nợ (khách hoặc nhà cung cấp) |
| `total` | numeric | = `transaction.amount` |
| `paid` | numeric | Đã thanh toán của công nợ này |
| `due_date` | date, nullable | Ngày hẹn trả |
| `settled_at` | timestamp, nullable | Thời điểm tất toán (khi `paid >= total`) |

---

## 3. Quy tắc nghiệp vụ

### 3.1. `payment_status` suy ra từ `paid_amount`
- `paid_amount == 0` → `pending`
- `0 < paid_amount < amount` → `partial`
- `paid_amount >= amount` → `paid`

> `payment_status` **không nhập tay** — luôn tính lại khi `paid_amount` đổi (giữ nhất quán).

### 3.2. Sinh công nợ
- Khi tạo transaction với `paid_amount < amount` → **tạo 1 `debt`**.
- `direction`:
  - `transaction.type = income` & trả sau → `receivable` (khách nợ mình).
  - `transaction.type = expense` & trả sau → `payable` (mình nợ nhà cung cấp).
- `debt.total = transaction.amount`; `debt.paid = transaction.paid_amount` ban đầu.

### 3.3. Nguồn chân lý số tiền đã trả
- `debt.paid` là **nguồn chân lý** cho phần đã thanh toán của công nợ.
- Mỗi lần ghi nhận trả nợ: cộng `debt.paid`, đồng bộ `transaction.paid_amount = debt.paid`, tính lại `payment_status`.
- Khi `debt.paid >= debt.total` → set `settled_at`, `payment_status = paid`.

> **Giao dịch trả đủ ngay** (không sinh debt): chỉ tồn tại `transaction.paid_amount` (= `amount`); không có gì để đồng bộ. Quy tắc "`debt.paid` là nguồn chân lý" chỉ áp dụng khi **có** công nợ.

### 3.4. Trả dư / tip / trả thêm
Khi khách đưa **nhiều hơn** số phải trả (tip, hoặc trả thêm cho dịch vụ nhỏ không itemize):
- Mỗi giao dịch vẫn giữ ràng buộc `paid_amount <= amount` (không có overpayment trên 1 giao dịch).
- Phần dư được ghi thành **một transaction income RIÊNG**: `amount` = phần dư, trả đủ ngay (`paid_amount = amount`, không sinh công nợ).
- `business_line_id` của khoản thu thêm = **mảng của giao dịch gốc**; `note` nên ghi rõ "tip / trả thêm".
- **Không** phân loại riêng trong báo cáo — gộp chung vào income của mảng (xem [reports.md](./reports.md)).

**Phạm vi & chi tiết:**
- Chỉ áp dụng cho khoản **khách trả mình** (giao dịch income). Expense (mình trả NCC) không có khái niệm tip.
- Phát sinh ở **2 thời điểm**: (a) lúc tạo giao dịch khách đưa dư ngay; (b) lúc **ghi nhận trả nợ** mà khách trả nhiều hơn phần còn lại (`debt.total − debt.paid`) → phần vượt thành khoản thu riêng (tip), công nợ tất toán đúng `total`.
- Khoản tip kế thừa `user_id` (người ghi) và `transacted_at` (thời điểm thao tác); `category_id = NULL` (income).
- Truy vết: MVP **không** thêm FK tới giao dịch gốc — ghi ngữ cảnh ở `note`. Có thể thêm `parent_transaction_id` sau nếu cần đối soát.

---

## 4. Nhập liệu

- Giao dịch sinh **trực tiếp** (nhập tay): màn giao dịch theo mảng (`/transactions/<mảng>`), chi phí chung (xem expenses).
- Giao dịch sinh **gián tiếp** (tự động): từ job sửa xe ([repair-jobs.md](./repair-jobs.md)), bán/mua device ([devices.md](./devices.md)), bán/nhập phụ kiện ([accessories.md](./accessories.md)).
- Form luôn có: số tiền (`amount`), đã thu/trả (`paid_amount`, mặc định = amount = đã thanh toán đủ), nếu < amount → bật nhập tên đối tác + ngày hẹn trả.

---

## 5. Báo cáo liên quan

- **Công nợ chưa thu/chưa trả**: `debts` chưa `settled_at`, nhóm theo `direction`, hiển thị còn lại `total - paid`, ngày hẹn, quá hạn.
- Lãi/lỗ & tổng thu/chi: tính trên `transactions` (xem [reports.md](./reports.md)).

---

## 6. Phụ thuộc / thay đổi

1. Là nền cho mọi spec mảng — chúng tham chiếu cách sinh transaction ở đây.
2. `architecture.md`: bổ sung `debts.direction`, `counterparty_name` (đổi từ `debtor_name` cho rõ cả 2 chiều).
3. Màn `/debts` & `/debts/[id]` (xem [screens.md](./screens.md)).

---

## 7. Acceptance criteria

- [ ] Tạo giao dịch trả đủ → `payment_status=paid`, không sinh debt.
- [ ] Tạo giao dịch trả một phần → `partial`, sinh 1 debt đúng `direction`.
- [ ] Income trả sau → debt `receivable`; expense trả sau → debt `payable`.
- [ ] Ghi nhận trả nợ tới khi đủ → `settled_at` được set, `payment_status=paid`.
- [ ] `payment_status` luôn khớp `paid_amount`, không bao giờ nhập tay lệch.
- [ ] Khách trả dư → giao dịch gốc vẫn `paid_amount = amount`; phần dư thành 1 income riêng (tip) đúng mảng giao dịch gốc.

---

## 8. Quyết định đã chốt

1. **Trả dư / tip**: trên mỗi giao dịch giữ `paid_amount <= amount`; khách đưa dư → ghi **khoản thu riêng** (tip), gắn mảng theo giao dịch gốc, gộp chung income (mục 3.4).
2. **Xoá giao dịch đã có công nợ đang trả dở**: **chặn nếu `debt.paid > 0`** (kèm cảnh báo).
3. **Lịch sử trả nợ**: **chỉ lưu tổng `debt.paid`**, không tách bảng `debt_payments` ở giai đoạn này.
4. Ràng buộc: `0 <= paid <= total`; "quá hạn" = `due_date < hôm nay` và chưa `settled_at`.
