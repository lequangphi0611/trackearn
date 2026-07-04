# TrackEarn

Web app quản lý doanh thu cho hộ kinh doanh nhỏ — thay thế Excel và giấy tờ.

Xem thêm tài liệu chi tiết trong [CLAUDE.md](CLAUDE.md) và [docs/](docs/) (business
overview, tech stack, architecture, spec từng màn hình, coding rules).

## Yêu cầu

- Node.js 22
- pnpm (`corepack enable pnpm`) — **không dùng npm/yarn**, xem `packageManager` trong `package.json`
- Docker + Docker Compose (nếu chạy qua container)

## Chạy dev (không qua Docker)

```bash
pnpm install
docker compose up -d db          # Postgres dev, map ra host port 5433
cp .env.example .env.local        # rồi sửa DATABASE_URL point vào port 5433
pnpm db:migrate
pnpm dev                          # http://localhost:3000
```

> Lưu ý: Postgres dev chạy ở **port 5433** trên host (container bên trong vẫn là
> 5432) để tránh đụng một Postgres khác có sẵn trên máy — xem `docker-compose.yml`.

## Build & chạy qua Docker

`docker-compose.yml` định nghĩa 3 service: `db` (Postgres), `migrate` (chạy
`drizzle-kit migrate` một lần rồi thoát), `app` (Next.js production build,
`Dockerfile` multi-stage: `deps` → `builder` → `runner` standalone output).

```bash
cp .env.example .env              # điền BETTER_AUTH_SECRET, ADMIN_USER/PASS thật
docker compose up -d --build      # build image app, chạy migrate, rồi start app
docker compose logs -f app        # theo dõi log
docker compose down               # dừng (thêm -v để xoá luôn volume DB)
```

`app` chỉ start sau khi `db` healthy và `migrate` chạy xong thành công
(`depends_on: condition: service_completed_successfully`). App expose ở
`http://localhost:3000`; đưa qua HTTPS/domain thật thì dùng `nginx.conf` làm
reverse proxy mẫu (proxy `localhost:3000`, Certbot tự chèn redirect HTTPS).

## Verify linting

```bash
pnpm lint
```

Dùng ESLint flat config (`eslint.config.mjs`) kế thừa `eslint-config-next`
(`core-web-vitals` + `typescript`). Không có lệnh `typecheck` riêng — type error
lộ ra khi `pnpm build` (Next.js build chạy `tsc` như một phần build).

## Verify app (kiểm chứng end-to-end)

Ngoài lint/build, thay đổi trên app nên được **verify thật** qua Playwright
thay vì chỉ đọc code:

- Hạ tầng chạy nằm ở `verify-env/` — Playwright đăng nhập sẵn (Better Auth),
  chạy trên **DB dev thật (port 5433)**, có 2 project `chromium` (desktop) và
  `mobile` (Pixel 5, sát PWA thật nhất). Chi tiết setup/chạy: xem
  [verify-env/README.md](verify-env/README.md).
- Trong Claude Code, dùng skill **`verify-app`** (`.claude/skills/verify-app/SKILL.md`)
  — wrapper quanh skill `verify` chuẩn, cộng thêm knowledge base bền vững
  (`verify-env/knowledge/system-map.md`, `step-map.md`, `locator-map.md`,
  `ERROR.md`) để không phải grep lại source mỗi lần verify.

Lệnh chạy nhanh (cần `docker compose up -d db` trước):

```bash
pnpm verify:browser   # cài Chromium cho Playwright (một lần)
pnpm verify:login     # đăng nhập, lưu session vào verify-env/.auth/
pnpm verify           # chạy tests/ trên cả desktop + mobile
pnpm verify:desktop   # chỉ desktop
pnpm verify:mobile    # chỉ mobile
```

## Scripts khác

| Lệnh | Vai trò |
|---|---|
| `pnpm db:generate` | Sinh migration Drizzle từ schema |
| `pnpm db:push` | Đẩy schema thẳng vào DB (dev, không qua migration file) |
| `pnpm db:seed` | Seed dữ liệu mẫu |
| `pnpm auth:generate` | Sinh lại Better Auth schema/types |
