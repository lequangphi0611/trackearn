# UI Design System — "Sổ thu chi"

## Nguyên tắc

App là **sổ thu chi** của hộ kinh doanh: con số là nhân vật chính, đọc nhanh trên điện thoại, nhập nhanh là ưu tiên #1. Mobile-first. Bản sắc đến từ **cột tiền tabular** (như sổ cái) + quy ước **số đen / số đỏ** của kế toán, không phải trang trí.

---

## Colors

Theme tokens định nghĩa trong `app/globals.css` (oklch, có `@theme inline` map sang Tailwind). **KHÔNG dùng theme Sky / sky-blue nữa.**

| Token | Vai trò |
|-------|---------|
| `--background` / `--foreground` | nền **ngà ấm** / chữ **mực** (gần đen) |
| `--primary` | mực (nút chính); dark mode = sáng |
| `--income` | **thu** — xanh kế toán |
| `--expense` | **chi** — đỏ chu sa (số đỏ) |
| `--brand` | hổ phách "đồng" (₫) — wordmark, FAB; **1 điểm nhấn duy nhất** |
| `--destructive` | lỗi / xoá (tách khỏi `--expense`) |
| `--muted` / `--muted-foreground` | caption, label, trạng thái trung tính |

### Quy tắc dùng màu

- **Tiền thu/chi**: luôn qua component **`<Money tone="income|expense">`** (`src/components/Money.tsx`) — KHÔNG `text-green-600`/`text-red-600` thủ công.
- Class màu money chỉ dùng token: `text-income`, `text-expense`, `bg-brand`, `text-brand-foreground`.
- Mọi surface (trang/card/modal) dùng CSS variable (`bg-background`, `bg-card`…) — KHÔNG `bg-white`/`bg-slate-50` (phá dark mode).
- Cần màu mới → thêm token vào `globals.css` trước, không hardcode hex trong JSX.

### Business line accent

Mỗi mảng có màu để quét bảng nhanh (badge/indicator) — slug đúng: `xe_muc`, `thiet_bi`, **`phu_kien`** (xem `BUSINESS_LINE_STYLES` trong `src/lib/constants.ts`).

| Mảng (slug) | Màu |
|-------------|-----|
| `xe_muc` | amber |
| `thiet_bi` | violet |
| `phu_kien` | emerald |

---

## Typography

### Font (qua `next/font`, không phải system stack)

- **Be Vietnam Pro** — body + display (thiết kế cho tiếng Việt, dấu đẹp). Biến `--font-sans`.
- **Geist Mono** — **số tiền** (tabular). Biến `--font-geist-mono` → Tailwind `font-mono`.

### Tabular numbers (signature)

Mọi cột tiền/số lượng dùng `font-mono` + class **`.tabular`** (hoặc `<Money>` đã gồm sẵn) để thẳng hàng dọc như sổ cái.

```tsx
<Money amount={1250000} tone="income" signed />   // +1.250.000 ₫, xanh, tabular
<span className="tabular">{formatCurrency(x)}</span>
```

### Type scale (app thiên dữ liệu → `text-sm` là body)

| Token | Dùng cho |
|-------|----------|
| `text-xs` | caption, timestamp, helper |
| `text-sm` | **body default**, cell, input |
| `text-sm font-medium` | label, column header |
| `text-base font-semibold` | card/section title |
| `text-lg font-semibold` | page title (mobile) |

---

## Spacing & Layout

- Container sau login: `mx-auto w-full max-w-3xl px-4`. Mobile chừa đáy cho FAB: `pb-24 sm:pb-8`.
- Card: shadcn `<Card>`/`<CardContent>`. Gap section `gap-4`. Field `gap-1.5`. Icon+text `gap-2`.
- Border radius: token `--radius`, dùng class shadcn — không override `rounded-*` lẻ.
- Breakpoints Tailwind mặc định, mobile-first (viết mobile trước, `sm:`/`md:` override lên desktop).

---

## Component conventions

- **Tiền** → `<Money>`. **Trạng thái thanh toán** → `<StatusBadge>` (paid=success, partial=warning, **pending=muted** — không đỏ "lỗi"). Quá hạn công nợ = `Badge variant="danger"`.
- **Form** → `<Field label name error hint>` (Label+Input+lỗi inline) + `<SubmitButton>` (`src/components/forms/`). Không tự ghép Label/Input rời, không dùng placeholder thay label.
- **Dialog** (vd ghi nhận trả, cảnh báo) → `components/ui/dialog`. **Dropdown** (nav, FAB) → `components/ui/menu`. **Select/badge/skeleton** → `components/ui/*`.
- **Empty state**: lời mời hành động, không chỉ "Chưa có dữ liệu" — vd "Bấm **Nhập** để thêm dòng đầu tiên."
- **Điều hướng mobile**: thanh tab dưới đáy (`BottomNav`, `sm:hidden`) — Tổng quan / Giao dịch / **nút + giữa** (nhập nhanh, việc #1) / Công nợ / Cài đặt; vùng ngón cái với tới. Desktop dùng thanh ngang (`DashboardNav`, `hidden sm:flex`).

---

## Motion

Dùng có chủ đích, tiết chế (nhiều animation → cảm giác AI-generated):

- **Skeleton** (`<Skeleton>`) khi tải lần đầu — cùng hình dáng nội dung thật.
- **fade-in** nhẹ khi nội dung stream vào (`animate-in fade-in-0 duration-300`).
- Dialog/menu: transition qua `data-[starting-style]`/`data-[ending-style]` (đã set trong primitive).
- Load-more: spinner pending + `scroll={false}` (không giật).
- **Quality floor bắt buộc**: `prefers-reduced-motion: reduce` tắt mọi animation/transition (đã set global ở `globals.css`); keyboard focus nhìn thấy được; responsive xuống mobile.

---

## Dark mode

- Class strategy (`<html class="dark">`); mọi token đã có giá trị `.dark` trong `globals.css`.
- Không hardcode `dark:` cho background/card/border — đã tự xử lý qua CSS variable. Test dark mode trước khi merge.
