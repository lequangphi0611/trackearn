import { z } from "zod";

// User id của Better Auth là text (không phải uuid).
const userIdSchema = z.string().min(1, "Thiếu người dùng");

export const createMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Họ tên từ 2 đến 50 ký tự")
    .max(50, "Họ tên từ 2 đến 50 ký tự"),
  email: z.string().trim().toLowerCase().pipe(z.email("Email không hợp lệ")),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

export const resetMemberPasswordSchema = z.object({
  userId: userIdSchema,
  newPassword: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

export const banMemberSchema = z.object({
  userId: userIdSchema,
  banReason: z
    .string()
    .trim()
    .max(200, "Lý do tối đa 200 ký tự")
    .optional()
    .transform((v) => v || undefined),
});

export const memberIdSchema = z.object({
  userId: userIdSchema,
});
