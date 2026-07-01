import { z } from "zod";

// quantity là numeric (cho phép lẻ — vd lít dầu); buy_price là tiền (đồng, int).
export const createOrRestockSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên phụ tùng").max(160),
  unit: z.string().trim().min(1, "Nhập đơn vị").max(20),
  quantity: z.coerce.number().positive("Số lượng nhập phải lớn hơn 0"),
  buyPrice: z.coerce.number().int().positive("Giá nhập phải lớn hơn 0"),
  minQuantity: z.coerce.number().min(0, "Ngưỡng không hợp lệ").optional(),
});

export const updateSparePartSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Nhập tên phụ tùng").max(160),
  unit: z.string().trim().min(1, "Nhập đơn vị").max(20),
  minQuantity: z.coerce.number().min(0, "Ngưỡng không hợp lệ"),
});

// Kiểm kê: đặt tồn thực đếm được (KHÔNG sinh expense).
export const adjustStockSchema = z.object({
  id: z.string().uuid(),
  quantity: z.coerce.number().min(0, "Tồn không hợp lệ"),
});

// Nhập thêm cho 1 phụ tùng đã có (từ màn chi tiết) — BQGQ + expense.
export const restockSchema = z.object({
  id: z.string().uuid(),
  quantity: z.coerce.number().positive("Số lượng nhập phải lớn hơn 0"),
  buyPrice: z.coerce.number().int().positive("Giá nhập phải lớn hơn 0"),
});

export const deleteSparePartSchema = z.object({ id: z.string().uuid() });
