# Tech Stack

## Frontend & Backend

| Layer | Công nghệ | Lý do |
|-------|-----------|-------|
| Framework | **Next.js 15** (App Router) | Full-stack trên 1 repo, SSR, Server Actions cho form nhập liệu |
| Language | **TypeScript** | Type-safe end-to-end, bắt lỗi sớm |
| Styling | **Tailwind CSS** + **shadcn/ui** | Responsive nhanh, mobile-first, không cần design system tùy chỉnh |
| State | **Zustand** (nếu cần) + React Server Components | Server state ưu tiên, client state tối thiểu |

## Database & ORM

| Layer | Công nghệ | Lý do |
|-------|-----------|-------|
| Database | **PostgreSQL** | Quan hệ phức tạp (job ↔ phụ tùng ↔ công nợ), ACID, free |
| ORM | **Drizzle ORM** | Type-safe schema, migration thuần SQL, nhẹ hơn Prisma |
| Schema migration | **drizzle-kit** | `drizzle-kit push` / `drizzle-kit migrate` |

## Auth

- **Better Auth** — email/password, session-based, 2 role: `owner` / `member`
- Không dùng OAuth (hộ gia đình, không cần Google login)

## Mobile

- **PWA** — `next-pwa` hoặc custom Service Worker
- Responsive layout, thêm vào Home Screen trên iOS/Android
- Không có app native riêng

## Deployment & Infrastructure

| Thành phần | Công nghệ |
|------------|-----------|
| Server | VPS tự quản lý (Ubuntu) |
| Container | **Docker Compose** |
| Reverse proxy | **Nginx** (SSL termination, proxy đến Next.js) |
| SSL | Let's Encrypt (Certbot) |
| Process | Next.js chạy trong container, restart tự động |

## Dev Tools

- **pnpm** — package manager
- **ESLint + Prettier** — code style
- **Cursor / Claude Code** — AI-assisted development
