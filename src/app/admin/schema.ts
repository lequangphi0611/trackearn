import { z } from "zod";

// Đặt lại mật khẩu chủ shop (owner) từ trang /admin — dùng khi owner quên mật
// khẩu và không còn ai đủ quyền reset trong app. Email lowercase cho khớp cách
// đăng ký (register/schema.ts cũng toLowerCase).
export const resetOwnerPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Email không hợp lệ")),
  newPassword: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});
