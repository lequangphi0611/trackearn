# system-map — bản đồ điều hướng app TrackEarn

Chỉ mục để trả lời "cần vào màn hình / route nào để test X". Đổi chậm → ít stale.
Skill `verify-app` đọc file này trước khi grep source. Bổ sung dần mỗi lần verify.

## Format mỗi entry

```
### <Tên màn hình / chức năng>
- route: <đường dẫn URL, vd /dashboard>
- mô tả: <chức năng chính, 1 dòng>
- đi tới từ: <màn hình/nút dẫn vào đây>
- đi tới: <các màn hình đi ra>
- src: <file source chính, vd src/app/(dashboard)/page.tsx>
- verified: <commit hash ngắn hoặc ngày lần cuối xác nhận>
```

> Trước khi tin một entry, áp GIAO THỨC FRESHNESS trong SKILL.md: nếu `src` đã đổi
> kể từ `verified` → đọc lại source, cập nhật entry.

---

### Báo cáo (Reports)
- route: `/reports` — nhận `?period=month|quarter|year&date=YYYY-MM-DD`
- mô tả: báo cáo theo kỳ (owner only): 3 card tổng quan (Doanh thu/Chi phí/Lãi + % so kỳ trước), bảng Lãi gộp từng mảng, Chi phí theo danh mục, Xu hướng 12 tháng.
- đi tới từ: BottomNav / DashboardNav (owner)
- đi tới: **drill-down sang `/transactions` hoặc `/transactions/<mảng>`** (reports.md §4.5) —
  SummaryCards "Doanh thu"/"Chi phí" → `/transactions?type=income|expense&from=&to=`;
  GrossProfitSection mỗi mảng "Doanh thu" → `/transactions/<slug>?type=income&...`,
  "Chi phí mảng" → `/transactions/<slug>?type=expense&excludeCategoryId=<cost_of_goods id>&...`
  (mọi mảng), "Giá vốn" CHỈ phụ kiện là link (`categoryId=<cost_of_goods id>`) — xe múc/thiết
  bị là text + tooltip (khác nguồn dữ liệu: repair_job_parts / devices.sell_date, không map
  1-1 với `transactions`); ExpenseSection mỗi category top-10 có categoryId thật → link,
  "chi phí chung" → `/transactions/chi-phi-chung`; "Còn lại (gộp)" và "Lãi"/"Thực thu"/điểm
  xu hướng KHÔNG click được (nhiều nguồn/không map 1-1). Ngoài ra chỉ đổi state qua URL
  (period/date).
- gác quyền: server component redirect `/` nếu role !== owner, `/login` nếu chưa đăng nhập
- src: src/app/(dashboard)/reports/page.tsx, components/{SummaryCards,GrossProfitSection,ExpenseSection}.tsx, src/queries/reports.ts (+ getCostOfGoodsCategoryId), src/lib/date.ts (vnPeriodRange/vnPeriodShift/vnDateOnly), src/lib/format.ts (formatPercentChange), src/lib/transaction-lines.ts (getLineByBusinessLine)
- verified: 2026-07-04 (drill-down; uncommitted tại lúc verify) — phần còn lại (kỳ/% so kỳ trước) verified b52fcfb, chưa re-verify lần này

### BottomNav (điều hướng mobile)
- route: không phải 1 route — component cố định `fixed inset-x-0 bottom-0`, render trong `layout.tsx` nên có mặt ở MỌI trang dashboard, nhưng container có class `sm:hidden` → chỉ hiện khi viewport < 640px (Tailwind `sm`). Desktop dùng `DashboardNav` (thanh ngang ở header, `hidden sm:flex`).
- mô tả: 5 slot `Tổng quan(/)` · `Giao dịch(/transactions)` · **FAB "+" nhô giữa** · `Công nợ(/debts)` · `Kho`. Tab active theo `pathname` qua hàm `match()` riêng từng tab, hiện `aria-current="page"` + icon đổi màu `text-brand`. Tab "Kho" active xuyên CẢ `/kho`, `/devices`, `/spare-parts` (1 tab dùng chung cho hub hàng hoá, tránh phải thêm tab mới mỗi mảng).
- FAB (giữa) hành vi rẽ nhánh theo trang: nếu đang ở `/` → click mở thẳng `QuickEntryDialog` (qua `useQuickEntryStore.open()`, cùng dialog với nút "Nhập giao dịch" đầu trang dashboard — tránh 2 lối vào khác hành vi). Nếu KHÔNG ở `/` (dialog không được mount ở trang đó) → click mở `Menu` (base-ui) liệt kê 4 mảng giao dịch (`TRANSACTION_LINES`: Xe múc/Thiết bị điện tử/Phụ kiện/Chi phí chung) + "Job sửa xe múc", mỗi mục là link điều hướng sang `/transactions/<slug>/new` hoặc `/repair-jobs/new`.
- không gác quyền theo role (không nhận prop `isOwner`) — hiện như nhau cho owner/staff; các route đích (`/debts`, `/kho`, v.v.) cũng không tự gác role ở page.tsx.
- ⚠️ lệch tài liệu: `docs/rules/ui-design.md` §Điều hướng mobile mô tả tab phải là "Cài đặt" nhưng code hiện tại (`BottomNav.tsx`) là **"Kho"** — doc có vẻ đã cũ so với code, chưa xác nhận cái nào là chủ đích đúng.
- đi tới từ: có mặt ở mọi trang dashboard (trong `layout.tsx`)
- đi tới: `/`, `/transactions`, `/debts`, `/kho` (và `/devices`, `/spare-parts` cùng active), `/transactions/<line>/new`, `/repair-jobs/new`
- src: src/app/(dashboard)/components/BottomNav.tsx, layout.tsx, src/lib/quick-entry-store.ts, components/dashboard/QuickEntryDialog.tsx, src/lib/transaction-lines.ts
- verified: 410aa26 (commit cuối chạm BottomNav.tsx; các file trên không nằm trong working-tree diff tại lúc verify 2026-07-04)

### Thêm phụ tùng mới (Spare part — new)
- route: `/spare-parts/new`
- mô tả: form tạo phụ tùng: Tên, Đơn vị, Số lượng nhập, Giá nhập/đv, Ngưỡng cảnh báo. Submit → action `createOrRestockSparePart`; nếu trùng tên (ilike) thì cộng dồn BQGQ thay vì tạo mới. Thành công → push `/spare-parts/<id>`.
- đi tới từ: /spare-parts (nút thêm), BottomNav → Kho
- đi tới: /spare-parts/<id> (sau khi lưu)
- src: src/app/(dashboard)/spare-parts/components/SparePartForm.tsx, spare-parts/actions.ts, spare-parts/schema.ts
- verified: b52fcfb

### Danh sách giao dịch theo mảng (Transactions list)
- route: `/transactions/[line]` — line slug: `xe-muc` | `thiet-bi` | `phu-kien` | `chi-phi-chung` (map ở src/lib/transaction-lines.ts). Query: `?from&to&type&status&q&page&categoryId&excludeCategoryId` (2 param cuối chỉ đến từ link drill-down báo cáo — không có ô chọn trong UI filter, chỉ giữ nguyên qua hidden input khi submit form / bấm "Xem thêm").
- mô tả: liệt kê giao dịch của 1 mảng, mặc định trong THÁNG hiện tại (`vnMonthRange`). Mỗi dòng là `<Link>` tới chi tiết; tiêu đề dòng = counterpartyName || note || tên danh mục. Badge "Tự sinh" khi sourceKind ≠ "manual". Restock phụ tùng có sourceKind="manual" nên KHÔNG có badge, tiêu đề = note "Nhập phụ tùng: ...". Có tab nav `TransactionLineTabs` (active=line hiện tại) để nhảy sang view tổng hợp/mảng khác, giữ from/to/type/status/q, bỏ categoryId/excludeCategoryId (xem entry "Danh sách giao dịch — view tổng hợp").
- đi tới từ: BottomNav/DashboardNav; sau restock (revalidatePath /transactions/xe-muc); /reports drill-down; tab nav từ view tổng hợp hoặc mảng khác
- đi tới: /transactions/[line]/[id] (bấm dòng), /transactions/[line]/new (nút Nhập), /transactions hoặc /transactions/<mảng khác> (tab nav)
- src: src/app/(dashboard)/transactions/[line]/page.tsx, list-params.ts, components/{TransactionFilters,TransactionResults,TransactionList,TransactionLineTabs}.tsx, src/queries/transactions.ts, src/lib/transaction-lines.ts
- verified: 2026-07-04 (categoryId/excludeCategoryId passthrough + tab nav; uncommitted tại lúc verify)

### Danh sách giao dịch — view tổng hợp (Transactions aggregate)
- route: `/transactions` (không có `[line]`) — mọi mảng (kể cả `business_line IS NULL`
  = chi phí chung), read-only, KHÔNG có nút "Nhập". Query giống `/transactions/[line]`
  + `categoryId`/`excludeCategoryId` (chỉ đến từ link drill-down báo cáo, không có ô
  chọn trong UI filter — chỉ nhận qua URL).
- mô tả: thay thế menu tĩnh cũ. Có tab nav "Tất cả | Xe múc | Thiết bị điện tử | Phụ
  kiện | Chi phí chung" (`TransactionLineTabs`, `active=null` ở view này) — đổi tab
  giữ `from/to/type/status/q`, **bỏ** `categoryId`/`excludeCategoryId`/`page` (chỉ
  carry 5 param trong `CARRIED_PARAMS`). Mỗi dòng có thêm badge "Mảng"
  (`aggregate=true` truyền xuống `TransactionList`) và dẫn tới
  `/transactions/<mảng-của-dòng>/[id]` (tính theo `t.businessLine`, không phải mảng
  đang xem). Empty-state khi lọc ra 0 dòng: "Chưa có giao dịch nào trong khoảng lọc
  này." (KHÁC câu "...Bấm Nhập..." của view theo-mảng, vì view này không có Nhập).
- đi tới từ: /reports (drill-down §4.5 — SummaryCards Doanh thu/Chi phí,
  ExpenseSection category row + "chi phí chung"), tab nav, BottomNav → Giao dịch
- đi tới: `/transactions/<line>` (đổi tab), `/transactions/<mảng-của-dòng>/[id]` (bấm dòng)
- src: src/app/(dashboard)/transactions/page.tsx, list-params.ts, components/TransactionLineTabs.tsx, components/TransactionFilters.tsx, components/TransactionResults.tsx, components/TransactionList.tsx, src/queries/transactions.ts (businessLine: undefined = không lọc, categoryId/excludeCategoryId), src/lib/transaction-lines.ts
- verified: 2026-07-04 (uncommitted tại lúc verify — xem step-map "Drill-down từ /reports")

### Chi tiết giao dịch (Transaction detail)
- route: `/transactions/[line]/[id]`
- mô tả: nếu sourceKind ≠ "manual" (tự sinh) → view READ-ONLY (số tiền lớn + metadata, note hiện ở hàng "Ghi chú"). Nếu "manual" → render `EditTransactionForm` (sửa được), note nằm ở field input `<Field label="Ghi chú" name="note">`. ⇒ restock phụ tùng (manual) rơi vào nhánh EDIT, note đọc bằng `getByLabel('Ghi chú')` (giá trị input).
- đi tới từ: /transactions/[line] (bấm dòng)
- src: src/app/(dashboard)/transactions/[line]/[id]/page.tsx, components/EditTransactionForm.tsx
- verified: 2026-07-04

### Người dùng (Settings/Users — owner only)
- route: `/settings/users`
- mô tả: danh sách user (owner đứng đầu, không có menu thao tác trên owner), mỗi member có menu "Thao tác với <tên>" (base-ui Menu) → Đặt lại mật khẩu / Khóa-Mở khóa / Xóa (4 dialog: ResetPasswordDialog, BanMemberDialog, UnbanMemberDialog, DeleteMemberDialog — tất cả điều khiển bởi `MemberActions` qua state `dialog: "reset"|"ban"|"unban"|"delete"|null`). Nút "Tạo thành viên" mở `CreateMemberDialog`.
- đi tới từ: DashboardNav/BottomNav (owner only)
- đi tới: ở lại trang (mọi thao tác chỉ revalidate, không điều hướng)
- src: src/app/(dashboard)/settings/users/{page.tsx,components/{UserList,MemberActions,CreateMemberDialog,BanMemberDialog,UnbanMemberDialog,DeleteMemberDialog,ResetPasswordDialog}.tsx,actions.ts}
- verified: 2026-07-04 (dialog fix — xem step-map "Dialog fix (US-3 audit mở rộng)")

### Chi tiết máy (Device detail)
- route: `/devices/[id]`
- mô tả: còn hàng → nút "Bán ra" (SellDeviceDialog) + "Xoá máy" (DeleteDeviceButton, chỉ hiện khi còn hàng); đã bán → nút "Hủy bán" (CancelSellDialog, chặn nếu công nợ bán đã thu 1 phần) thay cho nút Bán/Xoá. Có form sửa thông tin (EditDeviceForm) riêng.
- đi tới từ: /devices (danh sách), /devices/new (sau khi lưu)
- đi tới: ở lại trang (revalidate); /devices sau khi xóa máy
- src: src/app/(dashboard)/devices/{[id]/page.tsx,components/{SellDeviceDialog,SellDeviceForm,CancelSellDialog,DeleteDeviceButton,EditDeviceForm}.tsx,actions.ts}
- verified: 2026-07-04 (dialog fix — xem step-map)

### Chi tiết job sửa xe múc (Repair job detail)
- route: `/repair-jobs/[id]`
- mô tả: chi tiết job (phụ tùng đã xuất + tiền công + lãi), form sửa (EditJobForm), nút "Xoá job" (DeleteJobButton) ở cuối trang — hoàn tồn kho + hủy giao dịch thu khi xóa.
- đi tới từ: /repair-jobs (danh sách), /repair-jobs/new (sau khi lưu)
- đi tới: ở lại trang (revalidate); /repair-jobs sau khi xóa job
- src: src/app/(dashboard)/repair-jobs/{[id]/page.tsx,components/{EditJobForm,DeleteJobButton,CreateJobForm}.tsx,actions.ts}
- verified: 2026-07-04 (dialog fix — xem step-map)

### Chi tiết phụ tùng + Nhập thêm/BQGQ (Spare part detail)
- route: `/spare-parts/[id]`
- mô tả: hiện Tồn hiện tại, "Giá vốn (BQGQ)", Ngưỡng. Nút "Nhập thêm" mở dialog restock (Số lượng + Giá nhập) → action `restockSparePart` cập nhật tồn + giá vốn bình quân gia quyền + sinh expense cost_of_goods/xe_muc. Nút "Kiểm kê" (AdjustStockDialog) đặt lại tồn (không sinh expense).
- đi tới từ: /spare-parts/new (sau lưu), danh sách /spare-parts
- đi tới: ở lại trang (router.refresh sau restock)
- src: src/app/(dashboard)/spare-parts/[id]/page.tsx, spare-parts/components/RestockDialog.tsx, spare-parts/actions.ts (weightedBuyPrice/applyRestock)
- verified: b52fcfb
