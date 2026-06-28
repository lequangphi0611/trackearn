"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { withActionContext } from "@/lib/action-context";
import { setUserId } from "@/lib/request-context";
import { logError, logWarn } from "@/lib/logger";
import { ErrorCode, type ActionResult } from "@/lib/types";
import { changePasswordSchema, updateProfileSchema } from "./schema";

export const updateProfile = withActionContext(
  "updateProfile",
  async (
    _prev: ActionResult | null,
    formData: FormData,
  ): Promise<ActionResult> => {
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    if (!session)
      return {
        success: false,
        code: ErrorCode.AUTH_ERROR,
        error: "Chưa đăng nhập.",
      };
    setUserId(session.user.id);

    const parsed = updateProfileSchema.safeParse({
      name: formData.get("name"),
    });
    if (!parsed.success) {
      return {
        success: false,
        code: ErrorCode.VALIDATION_ERROR,
        error: "Dữ liệu không hợp lệ",
        fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    try {
      await auth.api.updateUser({
        body: { name: parsed.data.name },
        headers: h,
      });
      revalidatePath("/settings");
    } catch (err) {
      logError("updateProfile", err);
      return {
        success: false,
        code: ErrorCode.INTERNAL_ERROR,
        error: "Có lỗi xảy ra, thử lại sau.",
      };
    }

    return { success: true, data: undefined };
  },
);

export const changePassword = withActionContext(
  "changePassword",
  async (
    _prev: ActionResult | null,
    formData: FormData,
  ): Promise<ActionResult> => {
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    if (!session)
      return {
        success: false,
        code: ErrorCode.AUTH_ERROR,
        error: "Chưa đăng nhập.",
      };
    setUserId(session.user.id);

    const parsed = changePasswordSchema.safeParse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!parsed.success) {
      return {
        success: false,
        code: ErrorCode.VALIDATION_ERROR,
        error: "Dữ liệu không hợp lệ",
        fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
          string,
          string[]
        >,
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
      if (err instanceof APIError && err.body?.code === "INVALID_PASSWORD") {
        // Sai mật khẩu hiện tại — lỗi nghiệp vụ biết trước → WARN.
        logWarn("changePassword", err);
        return {
          success: false,
          code: ErrorCode.AUTH_ERROR,
          error: "Mật khẩu hiện tại không đúng.",
        };
      }
      logError("changePassword", err);
      return {
        success: false,
        code: ErrorCode.INTERNAL_ERROR,
        error: "Có lỗi xảy ra, thử lại sau.",
      };
    }

    return { success: true, data: undefined };
  },
);
