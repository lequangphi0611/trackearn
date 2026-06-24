# Spec màn hình — Giao dịch (`/transactions/...`)

> **Loại:** spec chi tiết nhóm màn giao dịch theo mảng, đầu bài cho AI/dev implement.
> **Tham chiếu:** [../screens.md](../screens.md) (mục 3), [transactions-and-debts.md](../transactions-and-debts.md), [expenses.md](../expenses.md), [repair-jobs.md](../repair-jobs.md), [devices.md](../devices.md), [coding-rules](../../coding-rules.md).
> **Quyết định nền:** báo cáo accrual; trả sau → công nợ; khách trả dư → tip (income riêng); timezone VN.

---

## 1. Mục đích & phạm vi

Nhập, xem, sửa **giao dịch thu/chi** theo từng mảng. Mỗi mảng có màn riêng; thêm màn **chi phí chung** (không thuộc mảng).

Mỗi nhóm gồm 3 route con: **danh sách** (`/...`), **nhập** (`/.../new`), **chi tiết-sửa** (`/.../[id]`). Bốn nhóm dùng **chung cấu trúc & component**, chỉ khác `business_line_id` và loại cho phép.

---

## 2. Bốn màn & ràng buộc

| Route gốc | `business_line_id` | Loại cho phép |
|-----------|--------------------|----------------|
| `/transactions/xe-muc` | `xe_muc` | income + expense |
| `/transactions/thiet-bi` | `thiet_bi` | income + expense |
| `/transactions/phu-kien` | `phu_kien` | income + expense |
| `/transactions/chi-phi-chung` | `NULL` | **chỉ expense** |

- **Quyền**: owner + member (đã đăng nhập).
- `business_line_id` **cố định theo route**, không cho người nhập đổi (nhập đúng mảng đang đứng).

---

## 3. Màn danh sách (`/transactions/<mảng>`)

### 3.1. Cột hiển thị
Ngày giờ (`transacted_at`), loại (thu/chi), số tiền (`amount`), **đã trả** & **còn lại** (2 giá trị: `paid_amount` và `amount − paid_amount`), trạng thái thanh toán (paid·partial·pending), danh mục (nếu expense), người nhập, **nguồn** (Tay / Tự sinh).

### 3.2. Bộ lọc (URL state — `?from=&to=&type=&status=&q=&page=`)
- **Khoảng ngày** (`from`–`to`), mặc định **tháng hiện tại**.
- **Loại** thu / chi.
- **Trạng thái thanh toán** (paid / partial / pending).
- **Tìm text** (`q`) trên `note` và `counterparty_name`.

### 3.3. Tải dữ liệu
- Nút **"Xem thêm"** (load-more, hợp mobile), mỗi lần tải **20** dòng, sắp xếp `transacted_at` giảm dần.

### 3.4. Giao dịch tự sinh
- Giao dịch sinh từ job sửa xe / mua-bán máy → **đánh dấu "Tự sinh"** + nút link về màn nguồn. **Không** sửa/xoá trực tiếp ở đây (mục 6).

---

## 4. Màn nhập (`/transactions/<mảng>/new`)

Form (client component) → Server Action `createTransaction` trả `ActionResult`. Các trường:

| Trường | Ràng buộc |
|--------|-----------|
| `type` | income/expense (màn chi-phí-chung: ẩn, cố định `expense`) |
| `amount` | > 0 |
| `paid_amount` | 0 ≤ paid ≤ amount; mặc định = `amount` (đã thanh toán đủ) |
| `counterparty_name` + `due_date` | **chỉ hiện khi** `paid_amount < amount` (trả sau) |
| `category_id` | **chỉ hiện khi** `expense`; select `expense_categories`, mặc định `other` |
| `note` | tuỳ chọn |
| `transacted_at` | mặc định now (giờ VN) |

- `business_line_id` gán theo route (ẩn).
- **Gắn máy (chỉ màn `thiet-bi` + `type = income`)**: hiện ô tùy chọn **"Gắn với máy trong kho"** (chọn device `in_stock`). Chọn máy → giao dịch thành **bán máy**:
  - `device.sell_price = amount`, `device.sell_date = transacted_at`, `device.status = sold`;
  - income `source_kind = device_sell`, `source_id = device.id`, link `sell_transaction_id`.
  - **Dùng chung một logic bán máy** với dialog "Bán ra" ở [devices.md](./devices.md) (cùng 1 hàm/Server Action, KHÔNG viết 2 code path) để 2 lối vào luôn cho kết quả giống hệt.
  - **Chống bán trùng**: kiểm tra lại device còn `in_stock` tại thời điểm lưu; nếu đã `sold` → trả lỗi `CONFLICT`.
  - Để trống → thu lẻ (sửa chữa nhỏ / phụ kiện lẻ), `source_kind = manual`.
- Lưu: validate Zod → tạo transaction; **tự gán** `user_id` = người đăng nhập (người tạo) và `created_at` = now (audit, server set — không nhận từ client). `paid_amount < amount` → sinh **công nợ** (xem [transactions-and-debts.md](../transactions-and-debts.md)). Thành công → về danh sách + revalidate.
- **Trả dư không nhập ở đây** (paid ≤ amount); tip xử lý ở luồng ghi nhận trả nợ / khoản thu riêng.

---

## 5. Màn chi tiết / sửa (`/transactions/<mảng>/[id]`)

- Hiển thị **người tạo** (`user_id`) + **mốc tạo** (`created_at`); nếu đã sửa, hiện **người sửa gần nhất** (`updated_by`) + `updated_at`.
- **Giao dịch nhập tay** (`source_kind = manual`): cho **sửa** (cập nhật amount/paid/category/note… → tính lại `payment_status`, đồng bộ công nợ; **set `updated_at` = now, `updated_by` = người đăng nhập**); cho **xoá** trừ khi đã có công nợ trả dở (**chặn nếu `debt.paid > 0`** — xem [transactions-and-debts.md](../transactions-and-debts.md)).
- **Giao dịch tự sinh** (`source_kind != manual`): **chỉ đọc**; hiển thị banner "Giao dịch này sinh từ <nguồn>" + nút mở màn nguồn (job/device). Mọi chỉnh sửa thực hiện ở nguồn.

---

## 6. Nhận biết nguồn giao dịch

Để khoá sửa + link nguồn, `transactions` cần biết mình từ đâu ra:

- Thêm 2 cột (nullable): **`source_kind`** (enum `manual` \| `repair_job` \| `device_buy` \| `device_sell`) và **`source_id`** (id bản ghi nguồn).
- `manual` = nhập tay (sửa được). Còn lại = tự sinh (khoá), `source_id` trỏ tới job/device để dựng link.
- → **Cập nhật** [transactions-and-debts.md](../transactions-and-debts.md) + `architecture.md` thêm 2 cột này.

---

## 7. Phụ thuộc

1. [transactions-and-debts.md](../transactions-and-debts.md) — model giao dịch, công nợ, `source_kind`/`source_id`.
2. [expenses.md](../expenses.md) — `category_id`, danh mục.
3. [repair-jobs.md](../repair-jobs.md), [devices.md](../devices.md) — nguồn của giao dịch tự sinh.
4. Dashboard nhập nhanh ([screens/dashboard.md](./dashboard.md)) tái dùng Server Action `createTransaction`.

---

## 8. Acceptance criteria

- [ ] 4 màn dùng chung component; `business_line_id` cố định theo route, người nhập không đổi được.
- [ ] Màn chi-phí-chung chỉ cho `expense`, `business_line_id = NULL`.
- [ ] List lọc được theo loại / khoảng ngày / trạng thái / text; phân trang hoạt động.
- [ ] Nhập trả đủ → `paid`; nhập trả sau → `partial/pending` + sinh công nợ; ô đối tác/hẹn trả chỉ hiện khi trả sau.
- [ ] Form expense hiện chọn danh mục (mặc định `other`); form income ẩn danh mục.
- [ ] Giao dịch tự sinh: đánh dấu, chỉ đọc, có link về nguồn; không sửa/xoá trực tiếp.
- [ ] Xoá giao dịch tay bị chặn khi `debt.paid > 0`.

---

## 9. Điểm chưa chốt

1. **Sửa số tiền giao dịch đã có công nợ trả dở**: cho sửa `amount` (tính lại còn-nợ) hay chặn như xoá? → đề xuất **cho sửa nhưng cảnh báo**, tính lại công nợ.
2. **Xuất dữ liệu** (CSV) từ màn list → để mở, chưa thuộc MVP.
