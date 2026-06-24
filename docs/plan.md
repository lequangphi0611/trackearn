# Plan triển khai — TrackEarn

> Lộ trình **thứ tự develop**: làm gì trước, gì song song, phụ thuộc nhau ra sao. Không mô tả chi tiết code — chi tiết nằm ở các spec trong [docs/spec/](spec/).
>
> **Nguyên tắc:**
> - **Critical path tuần tự**: Nền tảng → Auth → Lõi tài chính → (3 mảng song song) → Tổng hợp → Hoàn thiện.
> - **Vertical slice**: mỗi tính năng làm trọn schema → query → server action → màn hình → chạy thật, rồi mới sang cái khác.
> - Mọi code tuân [coding-rules](coding-rules.md); mọi giao dịch gắn audit (`user_id`/`created_at`/…).

---

## Sơ đồ phụ thuộc (rút gọn)

```
Phase 0  Nền tảng (db, schema, auth.ts, UI base)        [BLOCKING — làm trước hết]
   │
Phase 1  Auth & khung (middleware, register, login,      [register∥login]
   │      dashboard layout, settings hồ sơ)
   │
Phase 2  Lõi tài chính (transactions + debts)            [BLOCKING cho 3 mảng]
   │
Phase 3  ┌─ 3a Thiết bị ─┐
   │      ├─ 3b Xe múc   ─┤   ← 3 nhánh ĐỘC LẬP, làm SONG SONG
   │      └─ 3c Phụ kiện + Chi phí ─┘
   │
Phase 4  Tổng hợp & quản trị (dashboard, reports,         [sau khi có dữ liệu]
   │      settings/users)
   │
Phase 5  Hoàn thiện (PWA, states, deploy)
```

---

## Phase 0 — Nền tảng `[blocking, tuần tự, ưu tiên cao nhất]`

| Hạng mục | Spec |
|----------|------|
| DB client Drizzle + env (`DATABASE_URL`, `BETTER_AUTH_*`) | [tech-stack](tech-stack.md), [architecture](architecture.md) |
| **Schema** đầy đủ: bảng Better Auth (`user` + role + ban fields), `transactions`, `debts`, `expense_categories`, `devices`, `spare_parts`, `repair_jobs`, `repair_job_parts` | [auth-config](spec/auth-config.md), [architecture](architecture.md) |
| `auth.ts`: emailAndPassword, `additionalFields.role`, session 30d, **nextCookies (cuối)**, **admin plugin** | [auth-config](spec/auth-config.md) |
| Scripts DB (`auth:generate` → `db:generate` → `db:migrate`); seed `expense_categories` | [auth-config](spec/auth-config.md), [expenses](spec/expenses.md) |
| UI base: Tailwind + shadcn primitives, layout shell, `ActionResult`/`ErrorCode` (đã có) | [coding-rules](coding-rules.md), [ui-design](rules/ui-design.md) |

> Ra khỏi Phase 0 = DB migrate được, auth khởi tạo được, có khung UI.

---

## Phase 1 — Auth & khung điều hướng `[sau Phase 0]`

| Hạng mục | Spec | Ghi chú |
|----------|------|---------|
| **Middleware** bảo vệ route + `callbackURL` | [middleware](spec/middleware.md) | làm trước register/login |
| `ownerExists()` query | [auth-config](spec/auth-config.md) | dùng ở register & login |
| **`/register`** (mở rồi khoá, tạo owner) | [screens/register](spec/screens/register.md) | ∥ với login |
| **`/login`** (callbackURL, rate-limit) | [screens/login](spec/screens/login.md) | ∥ với register |
| `(dashboard)` layout + nav + gác role | [screens.md](spec/screens.md), [middleware](spec/middleware.md) | |
| **`/settings`** hồ sơ (sửa tên, đổi mật khẩu, đăng xuất) | [screens/settings](spec/screens/settings.md) §3 | phần `/settings/users` để Phase 4 |

> ⏩ **Song song**: register và login (sau khi có middleware + auth.ts).
> Mốc: đăng ký owner → đăng nhập → vào được khung dashboard rỗng.

---

## Phase 2 — Lõi tài chính `[blocking cho 3 mảng]`

| Hạng mục | Spec |
|----------|------|
| Model + quy tắc: `payment_status` suy ra, sinh `debt`, tip, audit | [transactions-and-debts](spec/transactions-and-debts.md) |
| Server Action `createTransaction` (generic) + validate Zod | [screens/transactions](spec/screens/transactions.md) |
| **`/transactions/<mảng>`** list + new + [id] (component dùng chung) | [screens/transactions](spec/screens/transactions.md) |
| **`/debts`** (2 tab) + `/debts/[id]` ghi nhận trả (+ tip) | [screens/debts](spec/screens/debts.md) |

> Đây là xương sống — mọi mảng đều sinh `transaction`. Phải xong trước Phase 3.
> Mốc: nhập được thu/chi 1 mảng, phát sinh & tất toán công nợ.

---

## Phase 3 — Ba mảng nghiệp vụ `[3 nhánh ĐỘC LẬP — song song]`

Cả ba đều dựng trên Phase 2 (transaction/debt) nhưng **không phụ thuộc lẫn nhau** → chia 3 người/3 luồng.

### 3a — Thiết bị điện tử
- `/devices` list + new + [id]; dialog **Bán ra** / **Hủy bán**; tích hợp **bán máy vào quick-entry** (gắn máy).
- Spec: [devices (nghiệp vụ)](spec/devices.md), [screens/devices](spec/screens/devices.md).

### 3b — Xe múc
- `/spare-parts` (BQGQ, cảnh báo tồn thấp); `/repair-jobs` new/[id] (xuất phụ tùng, `cost_price`, xuất quá tồn, sửa tự do).
- Spec: [repair-jobs (nghiệp vụ)](spec/repair-jobs.md), [screens/repair-jobs](spec/screens/repair-jobs.md).

### 3c — Phụ kiện + Chi phí
- `/transactions/phu-kien` (bán lẻ, không kho); `/transactions/chi-phi-chung`; seed + dùng `expense_categories`; expense `cost_of_goods` cho nhập hàng.
- Spec: [accessories](spec/accessories.md), [expenses](spec/expenses.md).

> ⏩ **Song song tối đa** ở phase này. Mỗi nhánh là một vertical slice hoàn chỉnh.

---

## Phase 4 — Tổng hợp & quản trị `[sau khi có dữ liệu các mảng]`

| Hạng mục | Spec | Phụ thuộc |
|----------|------|-----------|
| **Dashboard `/`** (số liệu ngày, quick-entry, công nợ, tồn kho) | [screens/dashboard](spec/screens/dashboard.md) | transactions + **3a (bán máy)** + debts |
| **`/reports`** (kỳ tháng/quý/năm, lãi gộp, chi phí theo danh mục, xu hướng, **biểu đồ**) | [screens/reports](spec/screens/reports.md), [reports](spec/reports.md) | toàn bộ dữ liệu |
| **`/settings/users`** (admin plugin: tạo/khóa/xóa/reset member) | [screens/settings](spec/screens/settings.md) §4 | admin plugin (Phase 0) |

> ⏩ Dashboard, reports, settings/users có thể song song nhau (đều chỉ *đọc/quản trị* trên dữ liệu đã có), trừ việc dashboard cần 3a xong.

---

## Phase 5 — Hoàn thiện `[trước khi go-live]`

- **PWA**: manifest, service worker, add-to-home; tối ưu mobile.
- **States**: loading/empty/`error.tsx` cho mọi màn ([error-handling](rules/error-handling.md)).
- **Deploy**: Docker Compose + Nginx + Certbot ([architecture](architecture.md)).
- Rà soát audit, phân quyền, edge cases còn treo trong mục "Điểm chưa chốt" của các spec.

---

## Gợi ý theo quy mô đội

- **Solo dev**: đi đúng critical path 0→1→2→3a→3b→3c→4→5 (mảng làm tuần tự, ưu tiên mảng dùng nhiều nhất trước — vd thiết bị/xe múc).
- **2–3 dev**: 1 người lo Phase 0–2 (nền + lõi); khi sang Phase 3 chia 3 mảng cho 3 người; gộp lại ở Phase 4.

## Mốc "chạy được" (milestones)
1. **M1** (hết P1): đăng ký/đăng nhập, khung app.
2. **M2** (hết P2): ghi giao dịch + công nợ cho 1 mảng.
3. **M3** (hết P3): cả 3 mảng vận hành đầy đủ.
4. **M4** (hết P4): có dashboard + báo cáo + quản lý người dùng.
5. **M5** (hết P5): PWA + deploy production.
