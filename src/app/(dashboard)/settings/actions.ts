"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { changePasswordSchema, updateProfileSchema } from "./schema";

export async function updateProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return { success: false, code: "AUTH_ERROR", error: "Chưa đăng nhập." };

  const parsed = updateProfileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      error: "Dữ liệu không hợp lệ",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await auth.api.updateUser({ body: { name: parsed.data.name }, headers: h });
    revalidatePath("/settings");
  } catch (err) {
    console.error("[updateProfile]", err);
    return { success: false, code: "INTERNAL_ERROR", error: "Có lỗi xảy ra, thử lại sau." };
  }

  return { success: true, data: undefined };
}

export async function changePassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return { success: false, code: "AUTH_ERROR", error: "Chưa đăng nhập." };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
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

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: false,
      },
      headers: h,
    });
  } catch (err) {
    if (err instanceof APIError) {
      return { success: false, code: "AUTH_ERROR", error: "Mật khẩu hiện tại không đúng." };
    }
    console.error("[changePassword]", err);
    return { success: false, code: "INTERNAL_ERROR", error: "Có lỗi xảy ra, thử lại sau." };
  }

  return { success: true, data: undefined };
}
