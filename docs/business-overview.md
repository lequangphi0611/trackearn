# Business Overview — TrackEarn

## Bài toán

Hộ kinh doanh nhỏ hiện quản lý thu chi bằng giấy tờ, Excel và trí nhớ. Không biết ngay hôm nay lãi hay lỗ bao nhiêu, không so sánh được tháng này với tháng trước, không kiểm soát được khoản chi nào đang ngốn tiền nhất.

TrackEarn tự động hóa toàn bộ việc này qua một web app chạy được trên cả desktop lẫn điện thoại.

---

## Hộ kinh doanh

Có 3 mảng hoạt động độc lập, cần báo cáo lãi/lỗ riêng từng mảng:

### 1. Sửa xe múc
- Mỗi lần sửa là một **job**: ghi tên khách, danh sách phụ tùng xuất kho (tên, số lượng, giá), tiền công
- Khách thường **trả chậm** — cần theo dõi công nợ
- Phụ tùng nhập về được lưu vào kho, xuất khi dùng cho job

### 2. Mua bán thiết bị điện tử (điện thoại, laptop, PC)
- Mua máy cũ vào (ghi: tên máy, giá mua, ngày mua, tình trạng/ghi chú)
- Bán ra — lãi là phần chênh lệch giá bán và giá mua
- Kèm theo: sửa chữa nhỏ lẻ (thu tiền công), bán phụ kiện lẻ
- Có thể trả ngay hoặc trả sau — ghi nhận công nợ nếu chưa thu đủ

### 3. Phụ kiện
- Bán lẻ (ốp lưng, cáp, pin...) — đơn giản
- Có thể trả ngay hoặc trả sau — ghi nhận công nợ nếu chưa thu đủ

---

## Người dùng

- **Chủ hộ (owner):** xem toàn bộ báo cáo, quản lý dữ liệu
- **Người thân/cộng sự (member):** nhập giao dịch, không xem báo cáo tổng hợp

Số lượng người dùng: 2–3 người trong gia đình.

---

## Nhu cầu cốt lõi

### Xem hàng ngày
- Tổng thu — tổng chi — lãi trong ngày (tách theo từng mảng)
- Danh sách giao dịch đã ghi trong ngày
- Công nợ chưa thu (ai nợ, bao nhiêu, từ bao giờ)
- Tồn kho thiết bị chưa bán

### Xem theo tháng
- So sánh doanh thu tháng này vs tháng trước
- Lãi gộp từng mảng (xe múc / thiết bị điện tử / phụ kiện)
- Chi phí phân theo danh mục — biết khoản nào đang tốn nhất

---

## Thanh toán

- Chủ yếu **tiền mặt**
- Chuyển khoản chưa ưu tiên trong giai đoạn đầu
- **Mọi giao dịch** (cả 3 mảng) đều có 2 trạng thái: **đã thu/đã trả** hoặc **trả sau** — nếu trả sau thì sinh ra công nợ cần theo dõi
- Công nợ gắn với giao dịch cụ thể, ghi nhận: tên người nợ, tổng nợ, đã trả, ngày hẹn trả

---

## Yêu cầu phi chức năng

- Chạy được trên **desktop và điện thoại** (PWA — thêm vào Home Screen)
- Nhập liệu nhanh trên điện thoại là ưu tiên UX hàng đầu
- Dữ liệu phải đồng bộ giữa các thiết bị (không offline-only)
