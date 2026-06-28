import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Họ tên từ 2 đến 50 ký tự")
      .max(50, "Họ tên từ 2 đến 50 ký tự"),
    email: z.string().trim().toLowerCase().pipe(z.email("Email không hợp lệ")),
    password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
