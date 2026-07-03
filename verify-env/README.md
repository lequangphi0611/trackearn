# verify-env — môi trường Playwright cho skill `verify`

Hạ tầng để skill `verify` (Claude Code) tự lái một browser **đã đăng nhập sẵn**
vào app TrackEarn, chạy end-to-end ổn định, không cần approve thủ công mỗi lần.

Đây **không** phải bộ test nghiệp vụ — chỉ là base config + cơ chế session để
`verify` mượn dùng.

## Kiến trúc

- `lib/config.ts` — nạp credentials (`verify.config.json` hoặc env `VERIFY_*`), export `STORAGE_STATE`.
- `auth.setup.ts` — đăng nhập 1 lần qua Better Auth API (`POST /api/auth/sign-in/email`), lưu session vào `.auth/storageState.json`.
- `playwright.config.ts` — `baseURL`, `webServer` tự bật `pnpm dev` nếu chưa chạy, và 3 project:
  - `setup` — đăng nhập, lưu storageState.
  - `chromium` — desktop (Desktop Chrome), bắt đầu đã login.
  - `mobile` — Chrome trên Pixel 5 (viewport mobile + touch). TrackEarn là PWA mobile-first nên đây là môi trường sát người dùng thật nhất.
- `tests/smoke.spec.ts` — smoke test chứng minh chuỗi login→session→browser hoạt động.

## Chuẩn bị (một lần)

1. Copy template rồi điền tài khoản **đã tồn tại** trong DB dev (Postgres port 5433):
   ```bash
   cp verify-env/verify.config.example.json verify-env/verify.config.json
   # sửa email/password
   ```
2. Cài Chromium cho Playwright:
   ```bash
   pnpm verify:browser
   ```

## Chạy

> ⚠️ **Postgres (port 5433) PHẢI chạy trước.** `/api/health` trả 503 khi DB down,
> khiến Playwright chờ tới timeout. Bật DB: `docker compose up -d db`.

```bash
pnpm verify:login    # đăng nhập, tạo .auth/storageState.json
pnpm verify          # chạy tests/ trên CẢ desktop + mobile với session đã lưu
pnpm verify:desktop  # chỉ desktop (Desktop Chrome)
pnpm verify:mobile   # chỉ mobile (Pixel 5) — sát PWA thật nhất
pnpm verify -- --headed   # xem browser chạy trực quan
```

> Mobile dùng engine Chromium nên KHÔNG cần cài browser gì thêm ngoài `pnpm verify:browser`.

App dev có thể để `webServer` tự bật, hoặc chạy sẵn `pnpm dev` (port 3000).

## Dùng cho verify một flow cụ thể

Thả một file `*.spec.ts` vào `verify-env/tests/` (nó khởi động đã đăng nhập nhờ
storageState) rồi `pnpm verify`. File tạm nên đặt tên `*.tmp.spec.ts` (đã gitignore).

## Lưu ý quan trọng

- **Chạy trên DB dev THẬT (5433).** Ưu tiên flow read-only. Bất kỳ thao tác
  tạo/sửa/xoá nào (giao dịch, thiết bị, đơn sửa chữa...) sẽ để lại dữ liệu thật
  trong DB dev — dọn dẹp sau hoặc chấp nhận dữ liệu bẩn.
- **Session sống 30 ngày.** Nếu đổi mật khẩu / session bị thu hồi → chạy lại
  `pnpm verify:login`.
- `verify.config.json` và `.auth/storageState.json` **không commit** (đã gitignore).
