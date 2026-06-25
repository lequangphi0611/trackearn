"use server";

import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { loginSchema } from "./schema";

// Chỉ chấp nhận path nội bộ → chống open redirect.
function safeCallbackURL(raw: FormDataEntryValue | null): string {
  const fallback = "/";
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  // phải bắt đầu đúng MỘT dấu "/", không "//" hay "/\" (chống //evil.com, /\evil.com)
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\n\r\t]/.test(raw)) return fallback; // không ký tự xuống dòng
  return raw;
}

export async function login(
  _prev: ActionResult<{ redirectTo: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      error: "Dữ liệu không hợp lệ",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const redirectTo = safeCallbackURL(formData.get("callbackURL"));

  try {
    await auth.api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password },
      headers: await headers(),
    });
  } catch (err) {
    if (err instanceof APIError) {
      // Sai thông tin đăng nhập — thông báo chung, không tiết lộ sai cái nào.
      return {
        success: false,
        code: "AUTH_ERROR",
        error: "Email hoặc mật khẩu không đúng.",
      };
    }
    console.error("[login]", err);
    return { success: false, code: "INTERNAL_ERROR", error: "Có lỗi xảy ra, thử lại sau." };
  }

  return { success: true, data: { redirectTo } };
}
