# step-map — scenario → spec file

Chỉ mục scenario/user story. **Trỏ tới spec file** đã pass trong `verify-env/tests/`
thay vì mô tả lại từng bước — spec là source of truth tự kiểm chứng.
Skill `verify-app` tra file này để tái dùng spec cũ thay vì dựng lại từ đầu.

## Format mỗi entry

```
### <Scenario / user story>
- spec: verify-env/tests/<tên>.spec.ts
- màn hình: <tham chiếu system-map>
- src: <file(s) source flow này chạm tới>
- verified: <commit hash ngắn hoặc ngày lần cuối spec pass>
- ghi chú: <tuỳ chọn — điều kiện dữ liệu, desktop/mobile...>
```

> Trước khi tái dùng, áp GIAO THỨC FRESHNESS: nếu `src` đổi kể từ `verified` →
> chạy lại spec, sửa nếu cần, cập nhật `verified`. Nếu spec fail → tin spec, không
> tin dòng này.

---

### Báo cáo hiển thị đúng số theo kỳ + đổi kỳ cập nhật + % so kỳ trước
- spec: verify-env/tests/reports.spec.ts
- màn hình: Báo cáo (system-map)
- src: src/app/(dashboard)/reports/**, src/queries/reports.ts, src/lib/date.ts, src/lib/format.ts
- verified: b52fcfb (pass desktop + mobile)
- ghi chú: điều hướng bằng URL tường minh `?period=&date=` để độc lập với "now" của server. Ground truth lấy trực tiếp từ Postgres 5433. Dữ liệu tại thời điểm verify: T6/2026 chỉ có expense 3,5tr (income=0); T7/2026 rev 7,8tr / exp 12,5tr / lãi -4,7tr; Năm 2026 exp 16tr / lãi -8,2tr. Nếu dữ liệu DB đổi, cập nhật lại các con số trong spec.
- ⚠️ spec này assert số tuyệt đối của T7/2026 (= tháng "now" của server). Bất kỳ **flow ghi** nào (restock, tạo giao dịch, bán máy...) chạy cùng suite sẽ đẩy expense/income vào T7 → làm spec này đỏ giả. Xem ERROR.md "write-flow làm đỏ spec số tuyệt đối". Chạy riêng khi debug: `pnpm exec playwright test -c verify-env/playwright.config.ts --project=chromium reports.spec.ts`.

### Bình quân gia quyền (BQGQ) khi nhập phụ tùng 2 lần khác SL/giá
- spec: verify-env/tests/bqgq-restock.tmp.spec.ts  (**giữ .tmp — KHÔNG promote**: flow ghi, pollute tháng hiện tại, không tự dọn transaction qua UI)
- màn hình: Spare part new + detail (system-map)
- src: src/app/(dashboard)/spare-parts/actions.ts (weightedBuyPrice), RestockDialog.tsx, SparePartForm.tsx, [id]/page.tsx
- verified: b52fcfb (pass desktop; DB xác nhận quantity 40 / buy_price 175000)
- kịch bản chứng minh: tạo 10 cái @100.000 → giá vốn 100.000; nhập thêm 30 @200.000 → BQGQ = round((10·100000+30·200000)/40) = **175.000** (≠ TB cộng 150.000), tồn 40. Screenshot ở verify-env/screenshots/bqgq/.
- ⚠️ DỌN DẸP sau chạy (transaction dính vào T7 phá baseline reports):
  `DELETE FROM transactions WHERE note LIKE 'Nhập phụ tùng: BQGQ Test %'; DELETE FROM spare_parts WHERE name LIKE 'BQGQ Test %';`
