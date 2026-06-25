"use server";

import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { ownerExists } from "@/queries/users";
import type { ActionResult } from "@/lib/types";
import { registerSchema } from "./schema";

export async function registerOwner(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      error: "Dữ liệu không hợp lệ",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  // Chống race/bypass: kiểm tra lại trước khi tạo owner.
  if (await ownerExists()) {
    return { success: false, code: "AUTH_ERROR", error: "Đã có chủ tài khoản." };
  }

  const { name, email, password } = parsed.data;

  try {
    // Tạo user + gán role owner trong 1 lần gọi; Better Auth tự tạo session (auto-login).
    await auth.api.signUpEmail({
      body: { name, email, password, role: "owner" },
      headers: await headers(),
    });
  } catch (err) {
    if (err instanceof APIError) {
      return { success: false, code: "CONFLICT", error: "Email đã được sử dụng." };
    }
    console.error("[registerOwner]", err);
    return { success: false, code: "INTERNAL_ERROR", error: "Có lỗi xảy ra, thử lại sau." };
  }

  return { success: true, data: undefined };
}
