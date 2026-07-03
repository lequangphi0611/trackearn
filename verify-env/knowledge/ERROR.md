# ERROR.md — nhật ký lỗi harness/spec lặp lại

Ghi những lỗi về **cách viết spec / locator / môi trường verify** mà ta từng dẫm
phải, kèm cách fix đã chứng minh, để lần sau đọc lại mà phòng tránh.

**KHÔNG** ghi bug thật của app vào đây (những cái đó báo cho user). Chỉ ghi khi đã
chứng minh fix làm test **pass**, không ghi phỏng đoán.

## Format mỗi entry

```
### <keyword bug ngắn gọn — để lần sau grep ra>
- triệu chứng: <lỗi nhìn thấy, thông báo, hành vi>
- nguyên nhân: <root cause>
- cách fix: <cách đã làm cho pass>
- ngày: <yyyy-mm-dd>
```

---

### hasText strict-mode violation — filter khớp 2 card (case-insensitive)
- triệu chứng: `locator('[data-slot="card-content"]').filter({hasText:'Gồm giá vốn'})` resolved to 2 elements → strict mode violation. Card tổng quan Chi phí và card "Lãi gộp từng mảng" cùng khớp.
- nguyên nhân: `hasText` của Playwright **case-insensitive** + normalize khoảng trắng. "Gồm giá vốn" khớp cả câu ghi chú "...Chi phí mảng không **gồm giá vốn** và chi phí chung." trong GrossProfitSection.
- cách fix: scope hẹp trước khi filter. Ở TrackEarn, CardContent card tổng quan có class `.p-4`, còn section card có `.px-6` (do tailwind-merge dedupe) → dùng base `[data-slot="card-content"].p-4`. Sau đó filter theo phụ đề mới an toàn. Đã pass desktop + mobile.
- ngày: 2026-07-03

### write-flow làm đỏ spec số tuyệt đối (dirty-data pollution)
- triệu chứng: reports.spec.ts bỗng đỏ, T7/2026 expense nhận "13.500.000"/"19.500.000" thay vì 12.500.000, dù không sửa gì màn Báo cáo.
- nguyên nhân: đồng hồ server ĐANG là 2026-07 (thật). Spec ghi (bqgq-restock) tạo transaction `transactedAt = new Date()` → rơi vào T7 → cộng vào tổng chi phí T7 mà reports.spec assert tuyệt đối. Chạy cùng suite 2 worker còn tạo race (đọc giữa 2 lần insert → thấy số lưng chừng).
- cách fix: (1) spec ghi vào tháng hiện tại phải **tự dọn** hoặc giữ `.tmp` và dọn tay bằng SQL (xem step-map BQGQ); (2) khi debug spec số tuyệt đối, chạy RIÊNG file đó: `pnpm exec playwright test -c verify-env/playwright.config.ts --project=chromium reports.spec.ts`; (3) đã xoá data test (DELETE theo note/name) → reports.spec xanh lại. Bài học: spec assert tổng tuyệt đối của "tháng now" vốn dễ vỡ trước mọi flow ghi.
- ngày: 2026-07-03
