# UI Design System

## Nguyên tắc

App thiên về **dữ liệu và số liệu** — mọi quyết định design phục vụ khả năng đọc nhanh trên điện thoại, không phải thẩm mỹ trang trí. Mobile-first là default.

---

## Colors

### Cài đặt shadcn/ui

Theme base: **Sky**. Cấu hình trong `app/globals.css`:

```css
@layer base {
  :root {
    --background: 248 250 252;       /* slate-50 */
    --foreground: 15 23 42;          /* slate-900 */
    --card: 255 255 255;
    --card-foreground: 15 23 42;
    --border: 226 232 240;           /* slate-200 */
    --input: 226 232 240;
    --muted: 241 245 249;            /* slate-100 */
    --muted-foreground: 100 116 139; /* slate-500 */
    --primary: 14 165 233;           /* sky-500 */
    --primary-foreground: 255 255 255;
    --destructive: 220 38 38;        /* red-600 */
    --destructive-foreground: 255 255 255;
    --ring: 14 165 233;
    --radius: 0.5rem;
  }

  .dark {
    --background: 15 23 42;          /* slate-950 */
    --foreground: 241 245 249;       /* slate-100 */
    --card: 30 41 59;                /* slate-800 */
    --card-foreground: 241 245 249;
    --border: 51 65 85;              /* slate-700 */
    --input: 51 65 85;
    --muted: 30 41 59;
    --muted-foreground: 148 163 184; /* slate-400 */
    --primary: 56 189 248;           /* sky-400 */
    --primary-foreground: 15 23 42;
    --destructive: 248 113 113;      /* red-400 */
    --destructive-foreground: 15 23 42;
    --ring: 56 189 248;
  }
}
```

### Semantic colors

Dùng Tailwind class, không hardcode hex:

| Ngữ cảnh | Light class | Dark class |
|----------|------------|------------|
| Thu nhập / đã thanh toán | `text-green-600` | `dark:text-green-400` |
| Chi phí / xóa / lỗi | `text-red-600` | `dark:text-red-400` |
| Công nợ chưa xong / cảnh báo | `text-amber-600` | `dark:text-amber-400` |
| Giao dịch chờ xử lý / pending | `text-sky-600` | `dark:text-sky-400` |
| Text phụ, label, caption | `text-muted-foreground` | (tự động qua CSS var) |

### Business line accent colors

Mỗi mảng kinh doanh có màu riêng — dùng trong badge, row indicator, filter chip. Mục đích: scan bảng ngay lập tức mà không cần đọc text.

| Mảng | Tailwind | Hex |
|------|----------|-----|
| Xe múc | `amber` | `#f59e0b` |
| Thiết bị điện tử | `violet` | `#8b5cf6` |
| Phụ tùng | `emerald` | `#10b981` |

```tsx
// badge mảng kinh doanh
const BUSINESS_LINE_STYLES = {
  xe_muc: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  thiet_bi: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  phu_tung: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
}
```

### Quy tắc dùng màu

- Không hardcode hex trong JSX/CSS — luôn dùng Tailwind class hoặc CSS variable
- Không thêm màu ngoài palette trên — nếu cần màu mới, thêm vào đây trước
- Mọi surface (trang, card, sidebar, modal) dùng CSS variable — không dùng `bg-white`, `bg-slate-50`, hay bất kỳ màu cứng nào. Lý do: dark mode tự động qua CSS variable, hardcode màu sẽ phá dark mode

---

## Typography

### Font stack

System font — không import Google Fonts, zero latency, hỗ trợ tiếng Việt đầy đủ:

```css
/* tailwind.config.ts */
fontFamily: {
  sans: [
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    "sans-serif",
  ],
}
```

### Type scale

App thiên về dữ liệu — `text-sm` (14px) là body default, không phải `text-base` (16px):

| Token | Size | Weight | Dùng cho |
|-------|------|--------|---------|
| `text-xs` | 12px | 400 | Caption, timestamp, helper text |
| `text-sm` | 14px | 400 | **Body default**, table cell, form input |
| `text-sm font-medium` | 14px | 500 | Label, column header |
| `text-base font-semibold` | 16px | 600 | Section title, card title |
| `text-lg font-semibold` | 18px | 600 | Page title (mobile) |
| `text-2xl font-bold` | 24px | 700 | KPI, số tiền nổi bật |
| `text-3xl font-bold` | 30px | 700 | Dashboard metric chính |

### Tabular numbers

Bắt buộc dùng `tabular-nums` cho mọi cột số tiền, số lượng — căn thẳng hàng dọc:

```tsx
// ✅
<span className="tabular-nums">1.250.000</span>

// ❌ — số sẽ lệch nhau trong table
<span>1.250.000</span>
```

### Line height

Tailwind default là đủ. Không override `leading-*` trừ khi text bị cắt trên mobile.

---

## Spacing & Layout

### Container

```tsx
// layout chính sau login
<main className="mx-auto max-w-2xl px-4 md:max-w-5xl md:px-6">
```

- Mobile (< 768px): full-width với `px-4` (16px mỗi bên)
- Desktop (≥ 768px, tức `md:`): max `max-w-5xl` (1024px) căn giữa

### Card padding

```tsx
<Card>
  <CardContent className="p-4 md:p-6">
```

- Mobile (< 768px): `p-4` (16px)
- Desktop (≥ 768px, tức `md:`): `p-6` (24px)

### Khoảng cách chuẩn

| Ngữ cảnh | Class |
|----------|-------|
| Gap giữa các card/section | `gap-4 md:gap-6` |
| Form field spacing | `space-y-4` |
| Inline items (icon + text) | `gap-2` |
| Stack items trong card | `space-y-3` |

### Border radius

Dùng shadcn default `--radius: 0.5rem` (8px). Không override `rounded-*` thủ công — dùng class của shadcn component.

---

## Breakpoints

Tailwind default, mobile-first. Không tạo breakpoint custom.

| Prefix | Min-width | Context |
|--------|-----------|---------|
| _(none)_ | 0px | Điện thoại dọc — **default** |
| `sm:` | 640px | Điện thoại ngang |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Desktop rộng |

Mobile-first: viết style cho mobile trước, dùng prefix để override lên desktop:

```tsx
// ✅
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

// ❌ — desktop-first
<div className="grid grid-cols-3 gap-6 sm:grid-cols-1">
```

---

## Component conventions

### Table (dữ liệu tài chính)

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="text-xs font-medium uppercase tracking-wide">
        Ngày
      </TableHead>
      <TableHead className="text-right text-xs font-medium uppercase tracking-wide">
        Số tiền
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="text-sm">15/06/2026</TableCell>
      <TableCell className="text-right text-sm font-medium tabular-nums">
        1.250.000 ₫
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

- Header: `text-xs uppercase tracking-wide` — phân biệt rõ với data row
- Số tiền: luôn `text-right tabular-nums`
- Thu nhập: thêm `text-green-600 dark:text-green-400`
- Chi phí: thêm `text-red-600 dark:text-red-400`

### Form

```tsx
<form className="space-y-4">
  <div className="space-y-1.5">
    <Label htmlFor="amount" className="text-sm font-medium">
      Số tiền
    </Label>
    <Input id="amount" className="text-sm" />
    {error && (
      <p className="text-xs text-destructive">{error}</p>
    )}
  </div>
</form>
```

- Label: `text-sm font-medium`
- Error: `text-xs text-destructive` ngay dưới input
- Không dùng placeholder thay label

### Badge mảng kinh doanh

```tsx
<span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", BUSINESS_LINE_STYLES[businessLine])}>
  {label}
</span>
```

### Empty state

```tsx
<div className="flex flex-col items-center gap-3 py-12 text-center">
  <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
  <Button size="sm" variant="outline">Thêm mới</Button>
</div>
```

---

## Dark mode

- Dùng class strategy: `<html class="dark">` — shadcn default
- Mọi màu semantic đã có `dark:` variant trong bảng trên
- Không dùng `dark:` cho background/card/border — những thứ này tự xử lý qua CSS variable
- Test dark mode trên mọi component trước khi merge
