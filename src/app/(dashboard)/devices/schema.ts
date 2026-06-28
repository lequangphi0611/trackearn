import { z } from "zod";

// Nhập máy mua vào. paid_amount ≤ buy_price; trả sau (paid < buy) cần tên đối tác.
export const createDeviceSchema = z
  .object({
    name: z.string().trim().min(1, "Nhập tên máy").max(160),
    conditionNote: z.string().trim().max(500).optional(),
    buyPrice: z.coerce.number().int().positive("Giá mua phải lớn hơn 0"),
    buyDate: z.string().min(1, "Chọn ngày mua"),
    buyFrom: z.string().trim().max(160).optional(),
    paidAmount: z.coerce.number().int().min(0, "Đã trả không hợp lệ"),
    counterpartyName: z.string().trim().max(120).optional(),
    dueDate: z.string().optional(),
  })
  .refine((d) => d.paidAmount <= d.buyPrice, {
    message: "Đã trả không được vượt giá mua",
    path: ["paidAmount"],
  })
  .refine(
    (d) => d.paidAmount >= d.buyPrice || (d.counterpartyName?.trim().length ?? 0) > 0,
    { message: "Nhập tên đối tác khi mua trả sau", path: ["counterpartyName"] },
  );

// Sửa thông tin máy. Action tự phân nhánh theo status (còn hàng cho sửa giá/ngày
// /nguồn; đã bán chỉ tên + tình trạng). confirmReduce: đồng ý hạ đã-trả khi hạ
// giá mua xuống dưới số đã trả (nhất quán updateTransaction).
export const updateDeviceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Nhập tên máy").max(160),
  conditionNote: z.string().trim().max(500).optional(),
  buyPrice: z.coerce.number().int().positive("Giá mua phải lớn hơn 0").optional(),
  buyDate: z.string().optional(),
  buyFrom: z.string().trim().max(160).optional(),
  confirmReduce: z.coerce.boolean().optional(),
});

// Bán ra. paid_amount ≤ sell_price; trả sau (paid < sell) cần tên đối tác.
export const sellDeviceSchema = z
  .object({
    id: z.string().uuid(),
    sellPrice: z.coerce.number().int().positive("Giá bán phải lớn hơn 0"),
    sellDate: z.string().min(1, "Chọn ngày bán"),
    paidAmount: z.coerce.number().int().min(0, "Đã thu không hợp lệ"),
    counterpartyName: z.string().trim().max(120).optional(),
    dueDate: z.string().optional(),
  })
  .refine((d) => d.paidAmount <= d.sellPrice, {
    message: "Đã thu không được vượt giá bán",
    path: ["paidAmount"],
  })
  .refine(
    (d) => d.paidAmount >= d.sellPrice || (d.counterpartyName?.trim().length ?? 0) > 0,
    { message: "Nhập tên đối tác khi bán trả sau", path: ["counterpartyName"] },
  );

export const cancelSellSchema = z.object({ id: z.string().uuid() });
