// Tách riêng khỏi DeviceTransactionForm.tsx (file "use client") vì đây là giá
// trị runtime cần import được từ Server Component (transactions/[line]/new/page.tsx):
// export 1 value từ module "use client" biến nó thành client reference khi
// Server Component import — gọi MODES.some(...) ở đó sẽ throw runtime error.
export const MODES = [
  { key: "sell", label: "Bán máy trong kho" },
  { key: "income", label: "Thu khác (sửa chữa, phụ kiện...)" },
  { key: "expense", label: "Chi phí" },
] as const;
export type DeviceTransactionMode = (typeof MODES)[number]["key"];
