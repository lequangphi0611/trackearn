# Spec — Chi phí (Expenses)

> **Loại:** spec nghiệp vụ + data model, đầu bài cho AI/dev implement.
> **Tham chiếu:** [business-overview.md](../business-overview.md) (nhu cầu "chi phí theo danh mục"), [architecture.md](../architecture.md) (data model), [screens.md](./screens.md) (giao dịch theo mảng).

---

## 1. Mục đích & phạm vi

Cho phép ghi nhận **mọi loại chi phí**, không chỉ chi phí vốn (mua máy, nhập phụ tùng/phụ kiện) mà cả **chi phí vận hành**: điện, nước, xăng dầu, thuê mặt bằng, công thợ, dụng cụ, vận chuyển, tiếp khách…

Mục tiêu phục vụ yêu cầu báo cáo tháng trong business-overview:
> *"Chi phí phân theo danh mục — biết khoản nào đang tốn nhất"*

---

## 2. Mô hình dữ liệu

### 2.1. Bảng mới `expense_categories`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | pk | |
| `name` | text | Tên hiển thị (vi) |
| `slug` | text unique | Mã định danh ổn định (vd `electricity`, `rent`, `other`) |
| `is_system` | boolean | `true` = danh mục seed sẵn, không cho xoá |
| `sort_order` | int | Thứ tự hiển thị |

**Seed sẵn** (`is_system = true`):

| slug | name |
|------|------|
| `cost_of_goods` | Vốn hàng (mua máy / nhập phụ tùng, phụ kiện) |
| `electricity` | Điện |
| `water` | Nước |
| `fuel` | Xăng dầu |
| `rent` | Thuê mặt bằng |
| `labor` | Công thợ / lương |
| `tools` | Dụng cụ |
| `shipping` | Vận chuyển |
| `hospitality` | Tiếp khách / ăn uống |
| `other` | **Khác** (fallback mặc định) |

> `other` là danh mục **fallback bắt buộc tồn tại**: expense không chọn danh mục → gán `other`.

### 2.2. Sửa bảng `transactions`

| Thay đổi | Chi tiết |
|----------|----------|
| Thêm `category_id` | FK → `expense_categories`, **nullable ở mức DB** (để income = `NULL`). Quy ước nghiệp vụ: **expense luôn có category** — không chọn thì set `other`, nên expense không bao giờ `NULL`. Income luôn `NULL`. |
| `business_line_id` → **nullable** | Chi phí **chung** (không thuộc mảng nào) để `NULL`. Income và chi phí có mảng vẫn gắn `business_line_id`. |

---

## 3. Phân loại & quy tắc gán

| Nguồn chi phí | category_id | business_line_id |
|---------------|-------------|------------------|
| Mua thiết bị (devices) | `cost_of_goods` | `thiet_bi` |
| Nhập phụ tùng (spare_parts) | `cost_of_goods` | `xe_muc` |
| Nhập phụ kiện | `cost_of_goods` | `phu_kien` |
| Chi phí vận hành thuộc 1 mảng | danh mục tương ứng | mảng đó |
| Chi phí vận hành dùng chung | danh mục tương ứng | **NULL** (chung) |
| Không chọn danh mục | `other` | theo lựa chọn (có thể NULL) |

**Quy tắc:**
- Chi phí vốn (mua/nhập) **sinh tự động** từ luồng mua device / nhập kho, gán sẵn `cost_of_goods` + mảng tương ứng.
- Chi phí vận hành **nhập tay**: chọn danh mục + (tùy chọn) mảng. Bỏ trống mảng → chi phí chung.

---

## 4. Nhập liệu (entry)

- **Chi phí thuộc 1 mảng**: nhập tại màn giao dịch của mảng đó (`/transactions/xe-muc` · `/thiet-bi` · `/phu-kien`) — chọn `type = expense` + danh mục.
- **Chi phí chung** (không thuộc mảng): nhập tại **màn riêng `/transactions/chi-phi-chung`** — form chỉ có `type = expense`, chọn danh mục, `business_line_id = NULL`.

Form chi phí (cả thuộc-mảng lẫn chung) **dùng chung bộ trường**: danh mục (select, mặc định `other`), số tiền, ngày, trạng thái thanh toán (đã trả / trả sau → công nợ), ghi chú. Khác biệt duy nhất: form thuộc-mảng gắn sẵn `business_line_id` của mảng; form chung để `NULL`.

---

## 5. Báo cáo

- **Chi phí theo danh mục (tháng)**: `GROUP BY category_id` trên `transactions` có `type = expense`, `transacted_at` trong tháng → sum `amount`. Hiển thị khoản tốn nhất → ít nhất.
- **Lãi/lỗ từng mảng**: chi phí có `business_line_id` tính vào mảng đó. Chi phí **chung** (`business_line_id = NULL`) **không** phân bổ vào mảng — hiển thị thành mục riêng **"Chi phí chung"** trong báo cáo tổng. (Phân bổ chung vào mảng: xem mục 8.)

---

## 6. Phụ thuộc / thay đổi kéo theo

1. **`architecture.md`** — cập nhật data model: `transactions` thêm `category_id`, `business_line_id` nullable; thêm bảng `expense_categories`.
2. **Schema** — `expense_categories` + seed; migration thêm cột vào `transactions`.
3. **`screens.md`** — bổ sung lối nhập "Chi phí chung" (sau khi chốt mục 8).
4. **Báo cáo** (`/reports`) — thêm phần "chi phí theo danh mục" + mục "Chi phí chung".

---

## 7. Acceptance criteria

- [ ] Có bảng `expense_categories` seed sẵn các danh mục, gồm `other`.
- [ ] Nhập 1 chi phí vận hành (vd "Điện") không gắn mảng → lưu `category=electricity`, `business_line_id=NULL`.
- [ ] Nhập chi phí mà không chọn danh mục → tự gán `other`.
- [ ] Mua device / nhập phụ tùng → expense tự sinh với `cost_of_goods` + đúng mảng.
- [ ] Báo cáo tháng nhóm chi phí theo danh mục, sắp xếp theo số tiền.
- [ ] Chi phí chung không bị tính nhầm vào lãi/lỗ của 1 mảng cụ thể.

---

## 8. Quyết định đã chốt

1. **Lối nhập "Chi phí chung"**: **màn riêng `/transactions/chi-phi-chung`**.
2. **Phân bổ chi phí chung vào mảng**: **không phân bổ** — hiển thị thành mục "Chi phí chung" riêng trong báo cáo (xem [reports.md](./reports.md)).
3. **Owner quản lý danh mục**: **chỉ seed sẵn**, không có màn quản lý danh mục ở giai đoạn này.
