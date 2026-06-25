import { z } from "zod";

export const createTransactionSchema = z
  .object({
    line: z.string().min(1),
    type: z.enum(["income", "expense"]),
    amount: z.coerce.number().int().positive("Số tiền phải lớn hơn 0"),
    paidAmount: z.coerce.number().int().min(0, "Đã trả không hợp lệ"),
    categoryId: z.string().optional(),
    counterpartyName: z.string().trim().max(120).optional(),
    dueDate: z.string().optional(),
    note: z.string().trim().max(500).optional(),
    transactedAt: z.string().min(1),
  })
  .refine((d) => d.paidAmount <= d.amount, {
    message: "Đã trả không được vượt số tiền",
    path: ["paidAmount"],
  })
  .refine((d) => d.paidAmount >= d.amount || (d.counterpartyName?.trim().length ?? 0) > 0, {
    message: "Nhập tên đối tác khi trả sau",
    path: ["counterpartyName"],
  });

export const updateTransactionSchema = z.object({
  id: z.string().uuid(),
  amount: z.coerce.number().int().positive("Số tiền phải lớn hơn 0"),
  categoryId: z.string().optional(),
  counterpartyName: z.string().trim().max(120).optional(),
  dueDate: z.string().optional(),
  note: z.string().trim().max(500).optional(),
  transactedAt: z.string().min(1),
  // Người dùng đã đồng ý cảnh báo "hạ số đã trả xuống bằng số tiền mới".
  confirmReduce: z.coerce.boolean().optional(),
});

export const deleteTransactionSchema = z.object({ id: z.string().uuid() });
