import { z } from "zod";

export const recordPaymentSchema = z.object({
  debtId: z.string().uuid(),
  amountPaid: z.coerce.number().int().positive("Số tiền phải lớn hơn 0"),
  paidDate: z.string().min(1),
});

export const updateDebtSchema = z.object({
  debtId: z.string().uuid(),
  counterpartyName: z.string().trim().min(1, "Nhập tên đối tác").max(120),
  dueDate: z.string().optional(),
});
