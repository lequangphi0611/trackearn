import { z } from "zod";

// 1 dòng phụ tùng xuất cho job. quantity numeric (lẻ được); unitPrice = giá bán đồng.
export const lineSchema = z.object({
  sparePartId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().int().min(0),
});
export type JobLine = z.infer<typeof lineSchema>;

// `lines` gửi lên dạng JSON (hidden input do JobForm dựng) → parse + validate.
const linesField = z
  .string()
  .transform((s, ctx) => {
    try {
      return JSON.parse(s);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Danh sách phụ tùng không hợp lệ" });
      return z.NEVER;
    }
  })
  .pipe(z.array(lineSchema));

// Trường chung cho tạo & sửa. paidAmount chỉ có ở TẠO — khi SỬA, tiền đã thu
// được giữ nguyên (đối chiếu lại tổng), không nhập lại.
const coreFields = {
  customerName: z.string().trim().min(1, "Nhập tên khách").max(160),
  jobDate: z.string().min(1, "Chọn ngày"),
  lines: linesField,
  laborFee: z.coerce.number().int().min(0, "Tiền công không hợp lệ"),
  counterpartyName: z.string().trim().max(120).optional(),
  dueDate: z.string().optional(),
  note: z.string().trim().max(500).optional(),
};

export const createRepairJobSchema = z.object({
  ...coreFields,
  paidAmount: z.coerce.number().int().min(0, "Đã thu không hợp lệ"),
});
export const updateRepairJobSchema = z.object({ id: z.string().uuid(), ...coreFields });
export const deleteRepairJobSchema = z.object({ id: z.string().uuid() });
