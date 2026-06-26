# Data Model & Domain Rules

Quy ước schema + nghiệp vụ **bắt buộc** cho mọi code chạm DB. Đây là nơi sinh nhiều bug nhất — đọc trước khi viết schema, query, hay action tài chính. Tham chiếu spec gốc: [transactions-and-debts](../spec/transactions-and-debts.md), [expenses](../spec/expenses.md).

## Tiền & số lượng

- **Tiền luôn là `bigint` đơn vị ĐỒNG (VND)** — `bigint("amount", { mode: "number" })`. KHÔNG dùng float hay `numeric` cho tiền (sai số). VND không có phần lẻ → số nguyên đồng.
- **Số lượng kho là `numeric`** (vd phụ tùng tính lít) — cho phép phần lẻ. Drizzle trả **string** trong TS → `Number(...)` khi tính.
- Hiển thị tiền: luôn qua `formatCurrency` (`lib/format`) + component `<Money>` (tabular). Không tự `${x} đ`.

## Thời gian (timezone)

- **Mọi cột thời điểm là `timestamptz`** — `timestamp(name, { withTimezone: true })`, lưu instant UTC. KHÔNG dùng `timestamp` naive.
- **Mọi bucket/lọc/so sánh theo NGÀY phải theo giờ VN** (`Asia/Ho_Chi_Minh`, UTC+7) qua `lib/date`: `vnMonthRange`, `vnTodayISODate`, `vnDateOnly`, `vnLocalToInstant`. KHÔNG dùng `now()` / `CURRENT_DATE` / `getDate()` UTC trực tiếp — giao dịch lúc 0–7h VN sẽ rơi nhầm ngày/tháng.
- `transacted_at` = ngày **nghiệp vụ** (sửa được, có default now); `created_at` = mốc **audit**, bất biến.

## Giao dịch & công nợ (lõi)

- `payment_status` **luôn suy ra** từ `paid_amount`/`amount` qua `derivePaymentStatus` (`lib/payment`) — KHÔNG nhập tay, KHÔNG lưu lệch.
- Trả sau (`paid_amount < amount`) → sinh **1** `debt`. Ràng buộc DB: `debt.transaction_id` **UNIQUE** (1 giao dịch ↔ tối đa 1 công nợ).
- `debt.paid` là **nguồn chân lý** số đã thanh toán; ghi nhận trả → cộng `debt.paid`, đồng bộ `transaction.paid_amount`, tính lại status; đủ → set `settled_at`.
- `direction` suy từ `type` (`deriveDirection`): income → `receivable`, expense → `payable`.
- `business_line` lưu **text** (`lib/constants` + `lib/transaction-lines`), KHÔNG bảng riêng. `NULL` = chi phí chung. **Suy từ route ở server — đừng tin client**; màn chi-phí-chung ép `expense` + `business_line = NULL`.
- `source_kind`: `manual` = sửa được; còn lại (`repair_job` / `device_buy` / `device_sell`) = **tự sinh → chỉ đọc**, mọi chỉnh sửa ở màn nguồn.

## Ghi DB an toàn (atomic + đồng thời)

- Thao tác chạm **nhiều bảng** (transaction + debt, kho + job…) phải nằm trong `db.transaction(async (tx) => …)`.
- Đọc-rồi-ghi trên dòng có thể bị tranh chấp (ghi nhận trả nợ, sửa số tiền) → khóa dòng bằng `.for("update")`.
- **Thứ tự khóa cố định: `transaction` → `debt`** ở MỌI action (tránh deadlock chéo). Nếu chỉ có `debtId`: đọc `transaction_id` (không khóa) → khóa `transaction` trước, `debt` sau.

## Phân trang

- Load-more tích lũy phải **chặn trần** (`MAX_PAGE`) trong query — không để `?page` lớn kéo cả bảng vào RAM.

## Audit (mọi bảng nghiệp vụ)

- `user_id` = người tạo (NOT NULL). `created_at` bất biến. `updated_at` + `updated_by` set mỗi lần sửa — **kể cả** ghi nhận trả nợ (đổi `paid`/`payment_status`).
