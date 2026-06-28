import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  // autoSignIn:false — signUpEmail (chỉ dùng cho đăng ký owner đầu tiên) KHÔNG
  // tự tạo session. registerOwner promote role=owner trong DB rồi mới signIn để
  // session snapshot đúng role (tránh cookieCache giữ role "member" cũ).
  emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: false },
  user: {
    additionalFields: {
      // Plugin admin (bên dưới) quản lý `role` với input:false — KHÔNG thể set
      // role khi signup (chống tự nâng quyền). Để input:false cho khớp thực tế.
      role: {
        type: "string",
        required: false,
        defaultValue: "member",
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 ngày
    updateAge: 60 * 60 * 24, // 1 ngày (sliding)
    cookieCache: { enabled: true, maxAge: 60 * 5 }, // cache 5 phút
  },
  plugins: [
    // owner quản lý member; "owner" là admin role (better-auth 1.6.x yêu cầu
    // adminRoles phải khai báo trong `roles` qua access control).
    admin({
      adminRoles: ["owner"],
      defaultRole: "member", // member do owner tạo mặc định role "member" (không phải "user")
      roles: { owner: adminAc, member: userAc },
    }),
    nextCookies(), // PHẢI là plugin cuối cùng
  ],
});
