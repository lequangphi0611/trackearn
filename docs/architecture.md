# Architecture

## Tổng quan

TrackEarn là một **Next.js monolith** — frontend, API, và business logic nằm trong cùng 1 repo, deploy lên 1 VPS. Không có microservice, không có tách frontend/backend riêng.

```
Browser / PWA
      │
      ▼
   Nginx (443)
      │
      ▼
 Next.js App (3000)
  ├── App Router (pages, layouts)
  ├── Server Components (data fetching)
  ├── Server Actions (mutations — form submit)
  └── API Routes (nếu cần webhook/export)
      │
      ▼
  Drizzle ORM
      │
      ▼
  PostgreSQL
```

## Luồng dữ liệu

### Đọc (hiển thị báo cáo, danh sách)
- Server Component fetch trực tiếp từ DB qua Drizzle — không qua REST API
- Dữ liệu render phía server, gửi HTML xuống browser → nhanh trên mobile 3G

### Ghi (nhập giao dịch, tạo job)
- Form gọi **Server Action** → validate → Drizzle insert → revalidate cache
- Không cần viết API endpoint riêng cho CRUD thông thường

### Auth flow
- Better Auth middleware kiểm tra session trên mọi route
- `owner`: truy cập toàn bộ app
- `member`: chỉ truy cập các trang nhập liệu, không vào trang reports tổng hợp

---

## Data Model (entity overview)

```
users
  id, email, name, role (owner | member), created_at

business_lines
  id, name (xe_muc | thiet_bi | phu_kien)

transactions
  id, type (income | expense), amount, paid_amount
  business_line_id (nullable — NULL = chi phí chung), user_id
  category_id (nullable — chỉ dùng cho expense; NULL income)
  note, transacted_at
  payment_status (paid | partial | pending)

expense_categories               -- danh mục chi phí (seed sẵn, có 'other')
  id, name, slug, is_system, sort_order

debts
  id, transaction_id, direction (receivable | payable)
  counterparty_name, total, paid, due_date, settled_at

devices                          -- kho thiết bị điện tử
  id, name, condition_note
  buy_price, buy_date, buy_from
  sell_price, sell_date
  status (in_stock | sold)

spare_parts                      -- kho phụ tùng xe múc
  id, name, unit, quantity, buy_price

repair_jobs                      -- job sửa xe múc
  id, customer_name, labor_fee, note, job_date
  transaction_id

repair_job_parts                 -- phụ tùng xuất cho mỗi job
  id, job_id, spare_part_id, quantity, unit_price
```

**Quan hệ quan trọng:**
- Mỗi `repair_job` sinh ra 1 `transaction` (income)
- Mỗi `device` bán ra sinh ra 1 `transaction` (income); mua vào sinh ra 1 `transaction` (expense)
- `debts` gắn với `transaction` khi `payment_status != paid` — áp dụng cho **mọi mảng** (xe múc, thiết bị điện tử, phụ kiện), không chỉ riêng xe múc
- `transactions` ghi cả **chi phí vận hành** (điện, thuê mặt bằng…) qua `category_id`, không chỉ chi phí vốn; chi phí dùng chung 3 mảng để `business_line_id = NULL` — xem [spec/expenses.md](spec/expenses.md)

---

## Cấu trúc thư mục

```
trackearn/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/              # login, register
│   │   ├── (dashboard)/         # layout chính sau login
│   │   │   ├── page.tsx         # dashboard ngày
│   │   │   ├── transactions/    # giao dịch theo mảng (xe-muc, thiet-bi, phu-kien)
│   │   │   ├── repair-jobs/     # job sửa xe múc
│   │   │   ├── devices/         # kho thiết bị
│   │   │   ├── spare-parts/     # kho phụ tùng
│   │   │   ├── debts/           # công nợ
│   │   │   ├── reports/         # báo cáo tháng (owner)
│   │   │   └── settings/        # hồ sơ, quản lý người dùng (owner)
│   │   └── api/                 # API routes (export, webhook)
│   ├── db/
│   │   ├── schema.ts            # Drizzle schema
│   │   └── index.ts             # db client
│   ├── lib/
│   │   ├── auth.ts              # Better Auth config
│   │   └── utils.ts
│   └── components/
│       ├── ui/                  # shadcn/ui primitives
│       └── forms/               # form nhập liệu
├── drizzle/                     # migration files
├── docs/                        # tài liệu dự án
├── docker-compose.yml
├── nginx.conf
└── CLAUDE.md
```

---

## Deployment

```yaml
# docker-compose.yml (simplified)
services:
  app:
    build: .
    environment:
      DATABASE_URL: postgres://...
      BETTER_AUTH_SECRET: ...
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - pg_data:/var/lib/postgresql/data
    restart: unless-stopped
```

- Nginx chạy trực tiếp trên host (không container) để dễ quản lý Certbot
- `docker compose up -d` khi deploy lần đầu
- Update: `git pull && docker compose build app && docker compose up -d app`
