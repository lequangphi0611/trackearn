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
- ⚠️ **DATA ĐÃ TRÔI (2026-07-04)**: sau các lần chạy restock-note-qty/bqgq specs, T7/2026 hiện là doanh thu **10.500.000** / chi phí **16.266.000** / lãi **-5.766.000** (KHÁC số 7,8tr/12,5tr/-4,7tr assert trong reports.spec.ts hiện tại → spec này SẼ ĐỎ nếu chạy, không phải do code hỏng mà do dữ liệu T7 đã có thêm giao dịch xe_muc test). Lãi gộp Xe múc live: doanh thu 6.000.000 / giá vốn (phụ tùng xuất) 1.666.667 / chi phí mảng 5.000.000 / lãi gộp **-666.667**. Thiết bị: 4.500.000 / 3.500.000 / 7.500.000 / -6.500.000 (không đổi). Xem `explain-mismatch.tmp.spec.ts` (đã pass với số live này) + screenshot `verify-env/screenshots/explain/`.

### Note nhập phụ tùng tự sinh có SỐ LƯỢNG + ĐƠN VỊ (tạo mới + Nhập thêm)
- spec: verify-env/tests/restock-note-qty.tmp.spec.ts (giữ .tmp — flow ghi; nhưng spec TỰ DỌN trong afterAll bằng SQL theo tên duy nhất `NoteVerify <ts>`)
- màn hình: Spare part new + detail, Transactions list + detail (system-map)
- src: src/app/(dashboard)/spare-parts/actions.ts (restockNote/applyRestock/createOrRestockSparePart), src/lib/format.ts (formatQuantity), transactions/[line]/page.tsx, [id]/page.tsx, EditTransactionForm.tsx
- verified: 2026-07-04 (pass desktop, pnpm dev từ source — xem ⚠️ dưới)
- kịch bản: tạo mới phụ tùng SL 7 lít → tx note `Nhập phụ tùng: <tên> — 7 lít`; Nhập thêm 5 → tx note `... — 5 lít`; danh sách /transactions/xe-muc hiện 2 dòng đúng; mở chi tiết dòng restock → field `Ghi chú` (input) = `... — 5 lít`. Quan sát thật: "Nhập phụ tùng: NoteVerify … — 5 lít".
- ⚠️ App ở :3000 có thể là PROD Docker image (source baked-in, không bind-mount) ⇒ thay đổi CHƯA build sẽ KHÔNG hiện. Phải `docker stop trackearn-app-1` + chạy `pnpm dev` từ source, verify xong `docker start` lại. Xem ERROR.md "port 3000 là PROD Docker image".

### Drill-down từ /reports sang /transactions (số phải khớp tuyệt đối)
- spec: verify-env/tests/reports-drilldown.spec.ts (read-only, giữ lại lâu dài — không `.tmp`)
- màn hình: Báo cáo (system-map), Danh sách giao dịch theo mảng + view tổng hợp `/transactions` (system-map)
- src: src/app/(dashboard)/reports/{page.tsx,components/SummaryCards.tsx,components/GrossProfitSection.tsx,components/ExpenseSection.tsx}, src/queries/reports.ts (getCostOfGoodsCategoryId), src/app/(dashboard)/transactions/{page.tsx,list-params.ts,components/TransactionLineTabs.tsx,components/TransactionFilters.tsx,components/TransactionResults.tsx,components/TransactionList.tsx}, src/app/(dashboard)/transactions/[line]/page.tsx, src/queries/transactions.ts
- verified: 2026-07-04 (working tree UNCOMMITTED tại thời điểm verify — không có commit hash; nếu các file src trên đổi so với lúc này, chạy lại spec trước khi tin) — pass desktop (14/14) + mobile (14/14)
- ghi chú:
  - Ground truth lấy trực tiếp Postgres 5433 tại lúc verify: T7/2026 doanh thu 10.500.000 / chi phí 16.266.000; Xe múc doanh thu 6.000.000 / giá vốn (phụ tùng xuất, repair_job_parts) 1.666.667 / chi phí mảng (loại cost_of_goods) 5.000.000; Thiết bị doanh thu 4.500.000 / giá vốn 3.500.000 / chi phí mảng 7.500.000; Phụ kiện = 0 (không có giao dịch trong kỳ); "Vốn hàng..." (cost_of_goods, id `d49a42f3-7dc0-43e3-95ab-2cd7688a417d`) = 3.766.000 (toàn bộ ở xe_muc); chi phí chung (business_line NULL) = 0 trong T7.
  - Đã chứng minh khớp tuyệt đối: card Doanh thu/Chi phí tổng, Xe múc Doanh thu + Chi phí mảng (excludeCategoryId), ExpenseSection category "Vốn hàng" (categoryId), filter form + tab nav.
  - Giá vốn Xe múc/Thiết bị đúng là text (không link) kèm tooltip; Giá vốn Phụ kiện đúng là link.
  - Aggregate `/transactions`: có badge "Mảng", KHÔNG có nút "Nhập", tab nav đổi mảng giữ from/to/type nhưng bỏ categoryId, empty-state đúng câu "Chưa có giao dịch nào trong khoảng lọc này." (không phải "Bấm Nhập...").
  - **GIỚI HẠN**: scenario "Xem thêm giữ categoryId qua trang" KHÔNG kiểm được bằng click thật — DB dev hiện chỉ có 12 giao dịch toàn bộ lịch sử, không filter nào đủ >20 dòng để `hasMore=true`/nút "Xem thêm" xuất hiện. Đã kiểm thay bằng: (a) đọc code `list-params.ts` xác nhận `moreParams` giữ categoryId/excludeCategoryId; (b) điều hướng trực tiếp `?page=1&categoryId=...` xác nhận server vẫn tôn trọng filter. Nếu sau này DB có >20 giao dịch cùng 1 categoryId, nên viết lại test này bằng click thật vào nút "Xem thêm".
  - Screenshot: verify-env/screenshots/reports-drilldown/ (01–10, desktop viewport).

### BottomNav trên mobile — hiện/ẩn theo viewport, active tab, FAB rẽ nhánh dialog/menu
- spec: verify-env/tests/bottomnav.spec.ts (read-only, giữ lại lâu dài)
- màn hình: BottomNav (system-map)
- src: src/app/(dashboard)/components/BottomNav.tsx, layout.tsx, src/lib/quick-entry-store.ts, components/dashboard/QuickEntryDialog.tsx, src/lib/transaction-lines.ts
- verified: 2026-07-04 (pass mobile 7/7 áp dụng — 4 test chỉ chạy ở project mobile, tự skip ở chromium; 1 test hiện/ẩn chạy cả 2 project)
- kịch bản: (1) nav `sm:hidden` — hiện ở mobile, ẩn ở desktop; (2) 5 nhãn Tổng quan/Giao dịch/[+]/Công nợ/Kho hiện đủ; (3) active tab đúng ở `/`, `/transactions`, `/debts`, `/kho`, và Kho vẫn active ở `/devices` + `/spare-parts` (route khác nhưng cùng tab); (4) FAB tại `/` mở thẳng dialog "Nhập giao dịch nhanh" (không qua menu); (5) FAB tại trang khác (`/transactions`) mở `Menu` liệt kê Xe múc/Thiết bị điện tử/Phụ kiện/Chi phí chung/Job sửa xe múc, không có dialog; click "Xe múc" điều hướng thật sang `/transactions/xe-muc/new`.
- ghi chú: gặp lỗi `getByRole('menuitem',{name:'Xe múc'})` khớp nhầm cả "Job sửa xe múc" (substring) — đã fix bằng `exact:true`, xem ERROR.md.

### Dialog fix (US-3 audit mở rộng) — 7 dialog còn lại đổi useActionState → onSubmit thủ công
- spec: verify-env/tests/dialog-fix-smoke.tmp.spec.ts (giữ .tmp — flow ghi: tạo/xóa member, máy, phụ tùng, job; TỰ DỌN qua chính flow Delete/CancelSell test, trừ 1 quirk xem ⚠️ dưới)
- màn hình: Người dùng (`/settings/users`), Chi tiết máy (`/devices/[id]`), Chi tiết phụ tùng (`/spare-parts/[id]`), Chi tiết job (`/repair-jobs/[id]`)
- src: settings/users/components/{UnbanMemberDialog,DeleteMemberDialog,ResetPasswordDialog,BanMemberDialog}.tsx, devices/components/{CancelSellDialog,DeleteDeviceButton,SellDeviceDialog,SellDeviceForm}.tsx, spare-parts/components/DeleteSparePartButton.tsx, repair-jobs/components/DeleteJobButton.tsx, transactions/components/TransactionForm.tsx, components/forms/SubmitButton.tsx
- verified: 2026-07-04 (pass desktop/chromium; rebuild Docker image trước khi chạy vì port 3000 là prod image nướng sẵn source — xem ERROR.md)
- kịch bản: tạo member test → khóa → mở khóa → đặt lại mật khẩu → xóa (tất cả trong 1 test); tạo máy test → bán → hủy bán → xóa máy; tạo phụ tùng test → xóa; tạo job test → xóa. Mỗi bước xác nhận dialog đóng đúng + toast đúng + state UI cập nhật đúng (không kẹt spinner).
- ⚠️ **quirk phát hiện khi verify (không phải bug từ fix này)**: `deleteSparePart` xóa được spare_part nhưng KHÔNG xóa transaction "Nhập phụ tùng: ..." đã sinh lúc tạo/restock — để lại transaction mồ côi trong DB (không phá gì vì không có FK, nhưng cộng vào chi phí xe_muc tháng hiện tại). Test tạo phụ tùng mới nên tự dọn thêm bằng SQL: `DELETE FROM transactions WHERE note LIKE 'Nhập phụ tùng: <tên test>%';` sau khi chạy, tương tự lưu ý ở BQGQ.
- ⚠️ Sonner toast: `getByText(<nội dung toast>)` có thể strict-mode-violation nếu cùng nội dung xuất hiện >1 lần trong `region "Notifications"` — xem ERROR.md "duplicate toast do effect phụ thuộc callback không ổn định".

### QuickEntryDialog — chỉ 1 toast "Đã lưu giao dịch" (regression cho bug duplicate-toast)
- spec: verify-env/tests/quickentry-toast.tmp.spec.ts (giữ .tmp — flow ghi transaction chi phí chung 50.000đ; KHÔNG tự dọn trong spec, phải xóa tay bằng SQL sau khi chạy: `DELETE FROM transactions WHERE business_line IS NULL AND amount=50000 AND note='' AND transacted_at > now() - interval '10 minutes';` rồi kiểm tra lại vì có thể cần chạy 2 lần nếu chạy suite nhiều lần)
- màn hình: Dashboard "/" (system-map QuickEntryDialog)
- src: components/dashboard/QuickEntryDialog.tsx, transactions/components/TransactionForm.tsx
- verified: 2026-07-04 (pass desktop/chromium)
- kịch bản: mở QuickEntryDialog, chọn mảng "Chi phí chung", nhập số tiền, lưu → chờ 1.5s (hứng effect refire trễ) → đếm `getByText("Đã lưu giao dịch")` phải đúng 1 (trước fix: nhiều lần do `onSuccess` không ổn định trong deps effect — xem ERROR.md).

### Bình quân gia quyền (BQGQ) khi nhập phụ tùng 2 lần khác SL/giá
- spec: verify-env/tests/bqgq-restock.tmp.spec.ts  (**giữ .tmp — KHÔNG promote**: flow ghi, pollute tháng hiện tại, không tự dọn transaction qua UI)
- màn hình: Spare part new + detail (system-map)
- src: src/app/(dashboard)/spare-parts/actions.ts (weightedBuyPrice), RestockDialog.tsx, SparePartForm.tsx, [id]/page.tsx
- verified: b52fcfb (pass desktop; DB xác nhận quantity 40 / buy_price 175000)
- kịch bản chứng minh: tạo 10 cái @100.000 → giá vốn 100.000; nhập thêm 30 @200.000 → BQGQ = round((10·100000+30·200000)/40) = **175.000** (≠ TB cộng 150.000), tồn 40. Screenshot ở verify-env/screenshots/bqgq/.
- ⚠️ DỌN DẸP sau chạy (transaction dính vào T7 phá baseline reports):
  `DELETE FROM transactions WHERE note LIKE 'Nhập phụ tùng: BQGQ Test %'; DELETE FROM spare_parts WHERE name LIKE 'BQGQ Test %';`

### Issue #12 — hợp nhất entry point Xe múc & Thiết bị điện tử (menu "+" / Giao dịch dropdown → hub)
- spec: verify-env/tests/issue-12-entry-points.tmp.spec.ts (đọc-chỉ-điều-hướng, không ghi DB — an toàn chạy lại nhiều lần)
- màn hình: BottomNav, DashboardNav, Transactions list (`/transactions/xe-muc`), Devices (`/devices`), New transaction (`/transactions/[line]/new?mode=`) — xem system-map "BottomNav" + "DashboardNav (điều hướng desktop) + hub CTA"
- src: BottomNav.tsx, DashboardNav.tsx, HubCard.tsx, transaction-lines.ts (getQuickEntryHref/getLineHubHref), transactions/[line]/page.tsx, transactions/[line]/new/page.tsx, devices/page.tsx, DeviceTransactionForm.tsx
- verified: 2026-07-05 (13/15 pass ổn định; 2 lần fail là flakiness base-ui Menu dưới tải song song — pass 100% khi chạy riêng, xem ERROR.md; uncommitted tại lúc verify)
- kịch bản: (1) FAB "+" (mobile, trang khác `/`) chỉ còn 1 mục "Xe múc" (không còn "Job sửa xe múc" rời), click → `/transactions/xe-muc` hiện đúng 2 HubCard "Tạo job sửa máy"/"Nhập thu / chi", mỗi CTA điều hướng đúng route; (2) FAB "Thiết bị điện tử" → `/devices`, hiện đủ 3 HubCard, "Bán máy từ kho" → `/transactions/thiet-bi/new?mode=sell` preset đúng tab "Bán máy trong kho" (verify bằng class `bg-primary` của Button trong SegmentedToggle — component KHÔNG dùng role="radio"), "Thu / Chi khác" → `?mode=income` preset tab "Thu khác"; (3) DashboardNav dropdown "Giao dịch" → "Thiết bị điện tử" đi `/devices`, "Xe múc" vẫn đi hub `/transactions/xe-muc`; (4) route cũ vẫn sống: `/repair-jobs`, `/transactions/thiet-bi`, `/devices/new`.
- ⚠️ locator "Giao dịch" phải `exact:true` (khớp nhầm nút "Nhập giao dịch" nếu không) — xem ERROR.md.
