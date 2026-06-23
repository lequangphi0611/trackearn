# Performance

## Images — next/image

Luôn dùng `next/image`, không bao giờ dùng `<img>` tag thông thường.

Bắt buộc khai báo `sizes` attribute theo ngữ cảnh:

| Ngữ cảnh | `sizes` |
|----------|---------|
| Card / thumbnail trong grid | `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw` |
| Full-width không giới hạn | `100vw` |
| Full-width đến max-width rồi cố định | `(max-width: 800px) 100vw, 800px` — thay 800px bằng max-width thực tế |
| Avatar / icon kích thước cố định | Giá trị px thực tế, VD `48px` |

```tsx
// ✅ — thumbnail thiết bị trong grid
<Image
  src={device.imageUrl}
  alt={device.name}
  width={400}
  height={300}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>

// ✅ — avatar user
<Image
  src={user.avatarUrl}
  alt={user.name}
  width={40}
  height={40}
  sizes="40px"
/>

// ❌ — không khai báo sizes
<Image src={...} alt={...} width={400} height={300} />
```

## Server Components

Ưu tiên Server Component. Chỉ dùng `"use client"` khi thực sự cần (xem [components.md](./components.md)).

Server Component render HTML phía server → gửi xuống browser → nhanh trên mobile 3G, không blocking JS bundle.

## Lazy loading

Heavy client component (rich text editor, chart library, date picker phức tạp) → lazy load bằng `next/dynamic`. Với thư viện chỉ chạy được ở client (không hỗ trợ SSR như recharts) → thêm `ssr: false`:

```ts
import dynamic from "next/dynamic"

// thư viện hỗ trợ SSR — không cần ssr: false
const HeavyPicker = dynamic(() => import("./HeavyPicker"), {
  loading: () => <Skeleton />,
})

// thư viện client-only (recharts, canvas-based) — cần ssr: false
const RevenueChart = dynamic(() => import("./RevenueChart"), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})
```

## Suspense

Đặt `<Suspense>` ở page level bao quanh async Server Component. Không bọc Suspense bên trong component tự nó (xem [data-fetching.md](./data-fetching.md)).

Mỗi page nên có ít nhất 1 Suspense boundary với skeleton UI phù hợp, tránh layout shift.

## Database queries

- Chỉ SELECT các cột cần thiết, không `SELECT *` khi data lớn
- Dùng index cho các cột thường xuyên filter (`user_id`, `business_line_id`, `transacted_at`)
- Tránh N+1: dùng Drizzle `with` (relations) thay vì query trong vòng lặp
