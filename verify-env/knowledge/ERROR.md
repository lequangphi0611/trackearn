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

### port 3000 là PROD Docker image (source baked-in) → thay đổi working-tree KHÔNG hiện
- triệu chứng: sửa source (uncommitted, mtime mới) nhưng verify vẫn thấy hành vi CŨ. Restart container cũng không đổi. DB lưu giá trị theo code cũ.
- nguyên nhân: `docker ps` thấy `trackearn-app-1` chạy image `trackearn-app` với `Cmd=["node","server.js"]` (Next standalone = PROD build), `docker inspect ... .Mounts = []` (KHÔNG bind-mount source). Source bị "nướng" vào image lúc build → mọi sửa file trên Windows/working-tree vô hình với app đang chạy. `reuseExistingServer:true` khiến Playwright dùng luôn container này.
- cách fix: để verify một thay đổi CHƯA build vào image, phải chạy app TỪ SOURCE:
  1. `docker stop trackearn-app-1` (giữ `trackearn-db-1` chạy — DB vẫn ở 5433).
  2. Chạy `pnpm dev` từ gốc repo (Playwright webServer sẽ tự bật, hoặc bật nền thủ công) → port 3000 phục vụ code working-tree.
  3. Verify.
  4. KHÔI PHỤC: kill node pnpm-dev, `docker start trackearn-app-1`, poll `/api/health`=200.
  Mẹo nhận biết nhanh: `docker inspect <app> --format '{{json .Mounts}}'` = `[]` và `Cmd=node server.js` ⇒ prod image, working-tree vô hình.
- ngày: 2026-07-04

### server action / route compile lần đầu dưới `pnpm dev` > timeout mặc định
- triệu chứng: submit form (vd "Lưu nhập kho") không redirect; `toHaveURL` 5s fail với "unexpected value .../new"; DB không có row mới (action chưa chạy xong hoặc bị bỏ giữa chừng khi Playwright teardown webServer).
- nguyên nhân: `pnpm dev` (Next dev) compile route + server action LẦN ĐẦU rất chậm (cả phút). Playwright còn tự teardown webServer nó tự bật ⇒ cold start lại mỗi lần.
- cách fix: (1) bật `pnpm dev` NỀN bền vững trước, poll `/api/health`=200, rồi mới chạy spec (reuseExistingServer sẽ dùng lại, không teardown). (2) tăng timeout mốc điều hướng đầu tiên: `expect(page).toHaveURL(.., {timeout:45_000})` + `test.setTimeout(120_000)`.
- ngày: 2026-07-04

### đọc số theo class ngay sau click/goto → đọc trúng lúc Suspense fallback (0 giả)
- triệu chứng: sau `click()`/`goto()` vào `/transactions...`, `page.locator('section > div.items-baseline .text-income').count()` trả về 0 (hoặc tổng sai) dù dữ liệu thật hiển thị đúng ngay sau đó (thấy rõ trong ARIA snapshot lúc fail). Chỉ tái hiện rõ ở project `mobile` (chậm hơn desktop), làm test đỏ giả với "Received: 0".
- nguyên nhân: `TransactionResults` được stream trong `<Suspense fallback={<TransactionListSkeleton/>}>` (transactions/page.tsx, [line]/page.tsx). `TransactionListSkeleton` dùng **CÙNG cấu trúc/class** `<section><div className="flex items-baseline justify-between ...">` như danh sách thật nhưng bên trong là `<Skeleton>` chứ không phải `Money` (`.text-income`/`.text-expense`) — nên count() không lỗi, chỉ âm thầm trả 0 nếu đọc đúng lúc fallback còn hiển thị (trước khi RSC stream nội dung thật tới, dễ xảy ra hơn ở mobile emulation chậm hơn).
- cách fix: trước khi đọc/tính tổng, đợi fallback biến mất: `await page.locator('div[aria-hidden]').first().waitFor({ state: "hidden", timeout: 10_000 }).catch(() => {})` (skeleton wrapper có `aria-hidden`; `.catch` để không throw khi không có skeleton nào — locator 0-match coi "hidden" là thoả ngay). Áp dụng ngay đầu hàm helper tính tổng, không phải ở từng chỗ gọi. Xem verify-env/tests/reports-drilldown.spec.ts (`sumDailySubtotals`).
- ngày: 2026-07-04

### getByRole name substring khớp nhầm ("Nhập" ⊂ "Nhập phụ tùng...", "Lọc" ⊂ "Bộ lọc (...)")
- triệu chứng: `page.getByRole('link', {name:'Nhập'})` đếm ra 5 thay vì 0 trên view tổng hợp `/transactions` (đáng lẽ không có nút "Nhập"); `page.getByRole('button',{name:'Lọc'})` báo strict-mode violation (2 phần tử) trên mobile.
- nguyên nhân: `getByRole(...,{name})` mặc định so khớp **substring, case-insensitive, normalize khoảng trắng** (như `hasText`) trừ khi truyền `exact:true`. "Nhập" khớp cả tiêu đề dòng giao dịch tự sinh "Nhập phụ tùng: ABC — 5 lít" (là accessible name của cả `<Link>` bọc dòng); "Lọc" khớp cả nút toggle mobile `aria-label="Bộ lọc (1 đang bật)"` (FilterBar.tsx) lẫn nút submit thật `<button>Lọc</button>`.
- cách fix: thêm `{ exact: true }` khi tên cần khớp là chuỗi ngắn dễ là substring của nội dung khác đang có trong DB/UI (đặc biệt tên hành động phổ biến như "Nhập", "Lọc", "Sửa", "Xoá"). Đã áp dụng: `getByRole('link',{name:'Nhập',exact:true})`, `getByRole('button',{name:'Lọc',exact:true})`.
- thêm ví dụ (2026-07-04, BottomNav FAB menu): `getByRole('menuitem',{name:'Xe múc'})` khớp nhầm cả menuitem "Job sửa xe múc" (chứa substring "xe múc"). Fix: `getByRole('menuitem',{name:'Xe múc',exact:true})`. Bài học chung: bất kỳ tên ngắn nào trùng 1 phần với tên dài hơn TRONG CÙNG danh sách menu/link đều cần `exact:true` để an toàn, không chỉ các từ hành động phổ biến.
- ngày: 2026-07-04

### Vòng tròn đen kèm chữ cái (vd "N") đè lên góc dưới-trái màn hình mobile khi chạy `pnpm dev`
- triệu chứng: screenshot mobile (Pixel 5 viewport) thấy 1 hình tròn tối kèm 1 chữ cái đè lên đúng icon tab đầu tiên của BottomNav (góc dưới-trái) — nhìn như bug UI (icon bị thay bằng avatar lạ). KHÔNG xuất hiện khi verify qua port 3000 chạy Docker prod image, CHỈ xuất hiện khi chuyển sang chạy từ source bằng `pnpm dev`.
- nguyên nhân: đó là **Next.js Dev Tools indicator** (`<nextjs-portal>` trong DOM, xác nhận bằng `document.elementFromPoint` + duyệt `parentElement` chain) — badge nổi mặc định của Next.js 15 dev mode, neo góc dưới-trái viewport. Next prod build (`next build`/Docker image) KHÔNG có badge này. Trùng vị trí với tab đầu tiên của BottomNav (cũng góc dưới-trái) nên dễ tưởng nhầm là app tự vẽ đè lên UI.
- cách fix: không phải bug — bỏ qua khi verify bằng `pnpm dev`, hoặc verify qua build prod (Docker) nếu cần screenshot "sạch" không có badge dev tools. Nếu cần xác minh 1 phần tử lạ trong screenshot có phải app thật hay không: dùng `page.evaluate(() => document.elementFromPoint(x,y))` rồi in `tagName`/`outerHTML` — `nextjs-portal` là dấu hiệu chắc chắn của dev tools, không phải nội dung trang.
- ngày: 2026-07-04

### getByText(toast) strict-mode violation — toast lặp lại nhiều lần (dấu hiệu bug app thật, không phải lỗi spec)
- triệu chứng: `expect(page.getByText("Đã khóa tài khoản")).toBeVisible()` báo strict-mode violation resolved to 3 elements, cả 3 cùng nội dung, đều nằm trong `region "Notifications"` (Sonner toast list).
- nguyên nhân: **đây từng là bug app thật** (không phải lỗi viết spec) — effect gọi `toast.success(...)` phụ thuộc thẳng vào 1 callback KHÔNG ổn định (`onOpenChange`/`onSuccess` truyền từ cha, là closure mới mỗi lần cha render lại, vd sau `revalidatePath` của server action). Effect deps đổi (dù `state` không đổi) → effect refire → gọi lại `toast.success` → mỗi lần refire sinh 1 toast MỚI (Sonner không dedupe theo nội dung). Đã tìm thấy ở `BanMemberDialog`/`UnbanMemberDialog`/`DeleteMemberDialog`/`ResetPasswordDialog`/`TransactionForm` (fix: dùng ref giữ callback mới nhất, effect chỉ phụ thuộc `state` — xem `SellDeviceForm.tsx` đã làm đúng từ đầu).
- cách fix (cho SPEC, khi bug app đã fix xong): sau khi sửa app, dùng `.first()` hoặc đợi thêm ~1.5s rồi assert `toHaveCount(1)` để CHỦ ĐỘNG bắt hồi quy — không chỉ `toBeVisible()` (`toBeVisible()` trên locator nhiều-match tự fail do strict mode nên vô tình cũng bắt được bug, nhưng test rõ ràng hơn nếu assert count tường minh).
- ⚠️ Nếu gặp lỗi này trong lúc verify 1 flow MỚI (chưa biết là bug hay chưa): đừng vội sửa spec cho qua (vd thêm `.first()` để né) — kiểm tra trước xem có phải bug app thật không (đọc effect deps của component liên quan) trước khi coi đây chỉ là vấn đề của spec.
- ngày: 2026-07-04

### write-flow làm đỏ spec số tuyệt đối (dirty-data pollution)
- triệu chứng: reports.spec.ts bỗng đỏ, T7/2026 expense nhận "13.500.000"/"19.500.000" thay vì 12.500.000, dù không sửa gì màn Báo cáo.
- nguyên nhân: đồng hồ server ĐANG là 2026-07 (thật). Spec ghi (bqgq-restock) tạo transaction `transactedAt = new Date()` → rơi vào T7 → cộng vào tổng chi phí T7 mà reports.spec assert tuyệt đối. Chạy cùng suite 2 worker còn tạo race (đọc giữa 2 lần insert → thấy số lưng chừng).
- cách fix: (1) spec ghi vào tháng hiện tại phải **tự dọn** hoặc giữ `.tmp` và dọn tay bằng SQL (xem step-map BQGQ); (2) khi debug spec số tuyệt đối, chạy RIÊNG file đó: `pnpm exec playwright test -c verify-env/playwright.config.ts --project=chromium reports.spec.ts`; (3) đã xoá data test (DELETE theo note/name) → reports.spec xanh lại. Bài học: spec assert tổng tuyệt đối của "tháng now" vốn dễ vỡ trước mọi flow ghi.
- ngày: 2026-07-03
