# Spec màn hình — Xe múc: Kho phụ tùng & Job sửa

> **Loại:** spec chi tiết màn nghiệp vụ mảng xe múc, đầu bài cho AI/dev implement.
> **Tham chiếu:** [../screens.md](../screens.md), [repair-jobs.md](../repair-jobs.md) (nghiệp vụ), [transactions-and-debts.md](../transactions-and-debts.md), [expenses.md](../expenses.md), [screens/transactions.md](./transactions.md), [coding-rules](../../coding-rules.md).
> **Quyết định nền:** giá vốn phụ tùng **bình quân gia quyền**; xuất quá tồn **cảnh báo nhưng vẫn cho** (tồn âm); job **cho sửa tự do**; job sinh 1 income `xe_muc`.

---

## 1. Mục đích & phạm vi

Hai nhóm màn của mảng xe múc:
- **Kho phụ tùng** (`/spare-parts`): nhập về, theo dõi tồn, cảnh báo tồn thấp.
- **Job sửa** (`/repair-jobs`): mỗi lần sửa = 1 job (khách + phụ tùng xuất + tiền công) → sinh 1 giao dịch thu.

> Thu/chi **lẻ** mảng xe múc (không gắn job) nhập qua quick-entry / `/transactions/xe-muc` (`source_kind = manual`). **Tạo job luôn ở màn riêng** `/repair-jobs/new`, không nhúng vào quick-entry.

Quyền: owner + member.

---

## 2. Màn kho phụ tùng

### 2.1. Danh sách (`/spare-parts`)
- **Cột**: tên, đơn vị, **tồn** (`quantity`), giá vốn (`buy_price`, BQGQ).
- **Cảnh báo tồn thấp**: highlight khi `quantity <= min_quantity`; nhãn riêng cho **hết hàng** (`quantity <= 0`) và **tồn âm** (`< 0`).
- **Tìm text** (`q`): tên phụ tùng. Tải: nút "Xem thêm" 20 dòng.

### 2.2. Nhập phụ tùng (`/spare-parts/new`)
Form → Server Action `createOrRestockSparePart`:

| Trường | Ràng buộc |
|--------|-----------|
| `name` | bắt buộc (nếu trùng tên đang có → gợi ý cộng vào phụ tùng đó) |
| `unit` | bắt buộc |
| `quantity` | > 0 (số lượng nhập) |
| `buy_price` | > 0 (giá nhập lần này) |
| `min_quantity` | ≥ 0, ngưỡng cảnh báo (mặc định 0) |

**Khi lưu:** cộng `quantity`, cập nhật `buy_price` theo **bình quân gia quyền** (xem [repair-jobs.md](../repair-jobs.md) §3.1); **sinh transaction expense** (`category = cost_of_goods`, `business_line = xe_muc`, `source_kind = manual` — nhập kho do người dùng chủ động).

### 2.3. Chi tiết (`/spare-parts/[id]`)
- Xem thông tin + tồn hiện tại; sửa `name`/`unit`/`min_quantity`.
- **Nhập thêm**: cùng logic 2.2 (BQGQ + expense).
- **Kiểm kê** (chỉnh tồn thủ công khi lệch đếm): cập nhật `quantity` trực tiếp, **không** sinh expense (xem [repair-jobs.md](../repair-jobs.md) §4).

---

## 3. Màn job sửa

### 3.1. Danh sách (`/repair-jobs`)
- **Cột**: khách (`customer_name`), ngày (`job_date`), tổng tiền, trạng thái thanh toán (paid·partial·pending).
- **Bộ lọc** (URL state): khoảng ngày (`job_date`), trạng thái thanh toán, tìm theo tên khách.
- Tải: "Xem thêm" 20 dòng, mới nhất trước.

### 3.2. Tạo job (`/repair-jobs/new`)
Form → Server Action `createRepairJob`:

| Trường | Ràng buộc |
|--------|-----------|
| `customer_name` | bắt buộc |
| `job_date` | mặc định hôm nay (VN) |
| **Dòng phụ tùng** (0..n) | mỗi dòng: chọn phụ tùng từ kho, `quantity` > 0, `unit_price` (**mặc định = `buy_price` hiện tại**, sửa được). Khi lưu **chụp `cost_price` = `buy_price` tại thời điểm xuất** vào dòng → tính lãi không bị lệch khi giá vốn đổi sau này |
| `labor_fee` | ≥ 0 (tiền công) |
| `paid_amount` | 0 ≤ paid ≤ tổng; mặc định = tổng |
| `counterparty_name` + `due_date` | chỉ khi `paid_amount < tổng` (khách trả sau; `counterparty_name` mặc định = `customer_name`) |
| `note` | tuỳ chọn |

- **Tổng tiền** = Σ(`quantity` × `unit_price`) + `labor_fee` (hiển thị tự tính realtime).
- **Trừ tồn**: mỗi dòng giảm `spare_parts.quantity`. **Xuất quá tồn**: cảnh báo nhưng vẫn cho lưu (tồn về âm).

**Khi lưu:** tạo `repair_job` + các `repair_job_parts`; trừ tồn; **sinh 1 transaction income** (`business_line = xe_muc`, `amount = tổng`, `source_kind = repair_job`, `source_id = job.id`), gắn `transaction_id`; trả sau → công nợ `receivable`.

### 3.3. Chi tiết / sửa (`/repair-jobs/[id]`)
- Hiển thị: khách, danh sách phụ tùng xuất, tiền công, tổng, **lãi job** = tổng − Σ(`quantity` × `repair_job_parts.cost_price`) (dùng giá vốn **đã chụp lúc xuất**, không phải `buy_price` hiện tại) — tiền công + chênh giá bán/giá vốn phụ tùng.
- **Sửa tự do**: đổi dòng phụ tùng / tiền công → hệ thống **đối chiếu chênh lệch tồn kho** (hoàn/trừ theo thay đổi) và **điều chỉnh transaction** (cập nhật `amount`/`paid_amount`, công nợ). Nếu tổng mới **< `paid_amount`** đã trả → phần dư thành **tip** (income riêng) theo quy tắc trả dư ([transactions-and-debts.md](../transactions-and-debts.md) §3.4).
- **Xoá job**: hoàn tồn (`+quantity` các phụ tùng đã xuất) + huỷ transaction; **chặn nếu `debt.paid > 0`**.

---

## 4. Giao dịch tự sinh

- Giao dịch thu của job (`source_kind = repair_job`) **chỉ đọc** ở màn transactions, link ngược về `/repair-jobs/[id]`. Mọi điều chỉnh làm tại màn job.

---

## 5. Phụ thuộc / thay đổi

1. [repair-jobs.md](../repair-jobs.md) — nghiệp vụ kho & job; **thêm cột `min_quantity`** vào `spare_parts` (ngưỡng cảnh báo) và **`cost_price`** vào `repair_job_parts` (giá vốn chụp lúc xuất) → cập nhật `architecture.md`.
2. [transactions-and-debts.md](../transactions-and-debts.md) — job sinh income, công nợ, `source_kind`.
3. [expenses.md](../expenses.md) — nhập phụ tùng = expense `cost_of_goods`.

---

## 6. Acceptance criteria

- [ ] `/spare-parts` cảnh báo phụ tùng `quantity <= min_quantity` (hết / âm có nhãn riêng).
- [ ] Nhập phụ tùng → cộng tồn (BQGQ) + sinh expense `cost_of_goods`/`xe_muc`; kiểm kê thủ công không sinh expense.
- [ ] Tạo job: `unit_price` mặc định = giá vốn hiện tại; tổng = Σ phụ tùng + tiền công; trừ tồn đúng; xuất quá tồn → cảnh báo nhưng vẫn lưu (tồn âm).
- [ ] Job sinh 1 income `xe_muc` (`source_kind=repair_job`); trả sau → công nợ `receivable`.
- [ ] Lãi job = tiền công + (giá bán − giá vốn) phụ tùng.
- [ ] Sửa job → đối chiếu lại tồn + điều chỉnh giao dịch; xoá job → hoàn tồn + huỷ giao dịch, chặn khi `debt.paid > 0`.
- [ ] Giao dịch của job chỉ đọc ở transactions, có link về job.

---

## 7. Điểm chưa chốt

1. **Ngưỡng tồn thấp**: dùng `min_quantity` theo từng phụ tùng (đã chọn). Có cần ngưỡng mặc định toàn cục cho phụ tùng mới không? → tạm `min_quantity = 0` (chỉ cảnh báo khi hết/âm) tới khi owner đặt ngưỡng.
2. **Lịch sử giá vốn**: BQGQ ghi đè `buy_price`; không lưu lịch sử từng lần nhập (đã giải quyết lệch lãi bằng `cost_price` chụp lúc xuất).
3. **Xoá phụ tùng khỏi kho**: cho xoá khi nào (chặn nếu đã có job tham chiếu)? → đề xuất **chặn xoá nếu đã xuất cho job**; ẩn/ngừng dùng thay vì xoá.
4. **Editability của expense nhập kho**: hiện `source_kind = manual` → sửa/xoá trực tiếp ở transactions không hoàn tồn. Cân nhắc khoá như giao dịch tự sinh sau.
