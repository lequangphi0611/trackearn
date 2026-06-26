"use server";

import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { ownerExists } from "@/queries/users";
import { withActionContext } from "@/lib/action-context";
import { logError, logWarn } from "@/lib/logger";
import { ErrorCode, type ActionResult } from "@/lib/types";
import { registerSchema } from "./schema";

export const registerOwner = withActionContext(
  "registerOwner",
  async (
    _prev: ActionResult | null,
    formData: FormData,
  ): Promise<ActionResult> => {
    const parsed = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
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

    // Chống race/bypass: kiểm tra lại trước khi tạo owner.
    if (await ownerExists()) {
      return {
        success: false,
        code: ErrorCode.AUTH_ERROR,
        error: "Đã có chủ tài khoản.",
      };
    }

    const { name, email, password } = parsed.data;

    // Không set role lúc signup — plugin admin chặn (FIELD_NOT_ALLOWED). Tạo user
    // trước (autoSignIn:false nên chưa có session).
    let userId: string;
    try {
      const res = await auth.api.signUpEmail({
        body: { name, email, password },
        headers: await headers(),
      });
      userId = res.user.id;
    } catch (err) {
      // Chỉ email trùng mới là lỗi nghiệp vụ biết trước → CONFLICT (WARN). Các
      // APIError khác (vd FIELD_NOT_ALLOWED) là bất thường → ERROR + generic.
      if (
        err instanceof APIError &&
        err.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
      ) {
        logWarn("registerOwner", err);
        return {
          success: false,
          code: ErrorCode.CONFLICT,
          error: "Email đã được sử dụng.",
        };
      }
      logError("registerOwner", err);
      return {
        success: false,
        code: ErrorCode.INTERNAL_ERROR,
        error: "Có lỗi xảy ra, thử lại sau.",
      };
    }

    try {
      // Bootstrap owner đầu tiên: gán role trực tiếp (chưa có admin để setRole),
      // rồi signIn để session snapshot đúng role=owner.
      await db.update(user).set({ role: "owner" }).where(eq(user.id, userId));
      await auth.api.signInEmail({
        body: { email, password },
        headers: await headers(),
      });
    } catch (err) {
      logError("registerOwner", err, { stage: "promote-owner" });
      return {
        success: false,
        code: ErrorCode.INTERNAL_ERROR,
        error: "Có lỗi xảy ra, thử lại sau.",
      };
    }

    return { success: true, data: undefined };
  },
);
