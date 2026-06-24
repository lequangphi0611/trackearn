# Spec màn hình — Kho thiết bị (`/devices`)

> **Loại:** spec chi tiết màn nghiệp vụ mảng thiết bị điện tử, đầu bài cho AI/dev implement.
> **Tham chiếu:** [../screens.md](../screens.md), [devices.md](../devices.md) (nghiệp vụ), [transactions-and-debts.md](../transactions-and-debts.md), [expenses.md](../expenses.md), [coding-rules](../../coding-rules.md).
> **Quyết định nền:** mua→expense `cost_of_goods`/`thiet_bi`; bán→income; **có "hủy bán"** (đảo in_stock + hủy income); lãi máy = `sell − buy`; trả sau → công nợ.

---

## 1. Mục đích & phạm vi

Quản lý kho máy cũ: nhập máy mua vào, theo dõi tồn, bán ra (sinh income), hủy bán khi khách trả lại. **Không** quản lý sửa chữa nhỏ / phụ kiện lẻ ở đây (chúng là giao dịch mảng `thiet_bi` — xem [screens/transactions.md](./transactions.md)).

3 route: **danh sách** (`/devices`), **nhập máy** (`/devices/new`), **chi tiết** (`/devices/[id]`). Quyền: owner + member.

---

## 2. Màn danh sách (`/devices`)

### 2.1. Đầu trang
- **Tổng vốn tồn** = Σ `buy_price` các máy `status = in_stock`.

### 2.2. Cột
Tên máy, tình trạng (`condition_note`), giá mua, ngày mua; nếu đã bán: giá bán, **lãi** (`sell − buy`); trạng thái (Còn hàng / Đã bán).

### 2.3. Bộ lọc (URL state `?status=&q=&from=&to=&page=`)
- **Trạng thái**: còn hàng (`in_stock`) / đã bán (`sold`) / tất cả.
- **Tìm text** (`q`): tên máy + `condition_note`.
- **Khoảng ngày**: theo `buy_date` — lọc máy nhập trong khoảng.
- Tải: nút **"Xem thêm" 20 dòng**, sắp xếp mới nhất trước.

---

## 3. Màn nhập máy (`/devices/new`)

Form → Server Action `createDevice` trả `ActionResult`:

| Trường | Ràng buộc |
|--------|-----------|
| `name` | bắt buộc |
| `condition_note` | tuỳ chọn |
| `buy_price` | > 0 |
| `buy_date` | mặc định hôm nay (VN) |
| `buy_from` | tuỳ chọn |
| `paid_amount` | 0 ≤ paid ≤ `buy_price`, mặc định = `buy_price` |
| `counterparty_name` + `due_date` | chỉ hiện khi `paid_amount < buy_price` (mua trả sau) |

**Khi lưu:** tạo `device` (`status = in_stock`) + **transaction expense** (`category = cost_of_goods`, `business_line = thiet_bi`, `amount = buy_price`, `source_kind = device_buy`, `source_id = device.id`); trả sau → công nợ `payable`. Gắn `buy_transaction_id`.

---

## 4. Màn chi tiết (`/devices/[id]`)

### 4.1. Hiển thị
Thông tin máy; nếu đã bán: giá bán, ngày bán, **lãi** (`sell − buy`, có thể âm). Link tới 2 giao dịch liên quan (mua/bán) — đều **tự sinh, chỉ đọc** (xem [screens/transactions.md](./transactions.md)).

### 4.2. Sửa thông tin
- Máy **còn hàng**: cho sửa `name`, `condition_note`, `buy_price`, `buy_date`, `buy_from`. Sửa `buy_price` → cập nhật transaction mua tương ứng.
- Máy **đã bán**: chỉ sửa `name` và `condition_note`; không sửa giá mua/bán/ngày trực tiếp (xử lý qua hủy bán rồi bán lại).

### 4.3. Dialog "Bán ra" (chỉ khi `in_stock`)
Nút **"Bán ra"** mở dialog:

| Trường | Ràng buộc |
|--------|-----------|
| `sell_price` | > 0 |
| `sell_date` | mặc định hôm nay |
| `paid_amount` | 0 ≤ paid ≤ `sell_price`, mặc định = `sell_price` |
| `counterparty_name` + `due_date` | chỉ khi `paid_amount < sell_price` (bán trả sau) |

**Khi xác nhận:** set `sell_price`/`sell_date`, `status = sold`; tạo **transaction income** (`business_line = thiet_bi`, `amount = sell_price`, `source_kind = device_sell`, `source_id = device.id`); trả sau → công nợ `receivable`. Gắn `sell_transaction_id`.

### 4.4. Dialog "Hủy bán" (chỉ khi `sold`)
Nút **"Hủy bán"** → dialog xác nhận. Khi đồng ý: đảo `status = in_stock`, xoá `sell_price`/`sell_date`/`sell_transaction_id`, **huỷ transaction income** (và công nợ nếu có).
- **Chặn** nếu giao dịch bán đã thu một phần (`debt.paid > 0`) — phải xử lý công nợ trước (nhất quán với quy tắc xoá giao dịch có công nợ).

---

## 5. Liên kết giao dịch tự sinh

- Giao dịch mua (`device_buy`) và bán (`device_sell`) **chỉ đọc** ở màn transactions, có link ngược về `/devices/[id]`. Mọi điều chỉnh tài chính của máy làm tại màn này (sửa / bán / hủy bán), không sửa trực tiếp giao dịch.

---

## 6. Phụ thuộc

1. [devices.md](../devices.md) — nghiệp vụ kho máy.
2. [transactions-and-debts.md](../transactions-and-debts.md) — giao dịch mua/bán, công nợ, `source_kind`/`source_id`.
3. [expenses.md](../expenses.md) — mua = expense `cost_of_goods`.

---

## 7. Acceptance criteria

- [ ] `/devices` hiện tổng vốn tồn + danh sách; lọc được trạng thái / tìm text / khoảng ngày; "Xem thêm" hoạt động.
- [ ] Nhập máy → device `in_stock` + expense `cost_of_goods`/`thiet_bi` = giá mua; trả sau → công nợ `payable`.
- [ ] Bán ra (dialog) → `status=sold` + income = giá bán; trả sau → công nợ `receivable`; lãi = `sell − buy` (cho phép âm).
- [ ] Hủy bán (dialog) → đảo `in_stock` + huỷ income; **chặn** khi giao dịch bán có `debt.paid > 0`.
- [ ] Giao dịch mua/bán hiển thị chỉ đọc, có link 2 chiều với device.

---

## 8. Điểm chưa chốt

1. **Sửa `buy_price` máy đã bán**: hiện không cho sửa trực tiếp (làm qua hủy bán → bán lại). Đủ cho MVP; xem lại nếu vướng.
2. **Xoá hẳn device**: cho xoá máy còn hàng (chưa phát sinh bán) kèm huỷ transaction mua? → đề xuất cho xoá khi `in_stock` và giao dịch mua chưa có công nợ trả dở; flag để chốt.
