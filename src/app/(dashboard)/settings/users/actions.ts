"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getCurrentSession } from "@/queries/session";
import { userHasTransactions } from "@/queries/users";
import { withActionContext } from "@/lib/action-context";
import { setUserId } from "@/lib/request-context";
import { logError, logWarn } from "@/lib/logger";
import { ErrorCode, type ActionResult } from "@/lib/types";
import { zodActionError } from "@/lib/form";
import {
  banMemberSchema,
  createMemberSchema,
  memberIdSchema,
  resetMemberPasswordSchema,
} from "./schema";

type OwnerContext = { headers: Headers; ownerId: string };

/**
 * Mọi action ở màn này đều owner-only (defense-in-depth ngoài gác route);
 * headers thật được truyền tiếp cho auth.api.* để Better Auth tự enforce
 * adminRoles lần nữa. Dùng getCurrentSession() (React cache) thay vì gọi
 * thẳng auth.api.getSession — dedupe với các lượt gọi khác trong request.
 */
async function requireOwner(): Promise<OwnerContext | null> {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "owner") return null;
  setUserId(session.user.id);
  return { headers: await headers(), ownerId: session.user.id };
}

const AUTH_FAIL: ActionResult = {
  success: false,
  code: ErrorCode.AUTH_ERROR,
  error: "Bạn không có quyền thực hiện thao tác này.",
};

/** Target phải tồn tại, là member, và không phải chính owner đang thao tác. */
async function findMemberTarget(
  ctx: OwnerContext,
  userId: string,
): Promise<{ id: string } | ActionResult> {
  const target = await db.query.user.findFirst({ where: eq(user.id, userId) });
  if (!target)
    return {
      success: false,
      code: ErrorCode.NOT_FOUND,
      error: "Không tìm thấy người dùng.",
    };
  if (target.role !== "member" || target.id === ctx.ownerId)
    return {
      success: false,
      code: ErrorCode.CONFLICT,
      error: "Không thể thao tác trên tài khoản chủ hộ.",
    };
  return { id: target.id };
}

/**
 * Gom phần lặp lại ở resetMemberPassword/banMember/unbanMember/deleteMember:
 * xác thực owner + tìm target member. `createMember` không có target nên
 * không dùng helper này. Validate input trước (schema per-action) để
 * `handler` chỉ còn phần khác nhau thực sự (lời gọi auth.api.* cụ thể).
 */
async function withOwnerAndTarget(
  userId: string,
  handler: (ctx: OwnerContext, target: { id: string }) => Promise<ActionResult>,
): Promise<ActionResult> {
  const ctx = await requireOwner();
  if (!ctx) return AUTH_FAIL;
  const target = await findMemberTarget(ctx, userId);
  if ("success" in target) return target;
  return handler(ctx, target);
}

export const createMember = withActionContext(
  "createMember",
  async (
    _prev: ActionResult | null,
    formData: FormData,
  ): Promise<ActionResult> => {
    const ctx = await requireOwner();
    if (!ctx) return AUTH_FAIL;

    const parsed = createMemberSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);

    try {
      await auth.api.createUser({
        body: {
          name: parsed.data.name,
          email: parsed.data.email,
          password: parsed.data.password,
          role: "member",
        },
        headers: ctx.headers,
      });
    } catch (err) {
      if (
        err instanceof APIError &&
        (err.body?.code === "USER_ALREADY_EXISTS" ||
          err.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL")
      ) {
        logWarn("createMember", err);
        return {
          success: false,
          code: ErrorCode.CONFLICT,
          error: "Email này đã được sử dụng.",
          fieldErrors: { email: ["Email này đã được sử dụng."] },
        };
      }
      logError("createMember", err);
      return {
        success: false,
        code: ErrorCode.INTERNAL_ERROR,
        error: "Không thể tạo tài khoản, thử lại.",
      };
    }

    revalidatePath("/settings/users");
    return { success: true, data: undefined };
  },
);

export const resetMemberPassword = withActionContext(
  "resetMemberPassword",
  async (
    _prev: ActionResult | null,
    formData: FormData,
  ): Promise<ActionResult> => {
    const parsed = resetMemberPasswordSchema.safeParse(
      Object.fromEntries(formData),
    );
    if (!parsed.success) return zodActionError(parsed.error);

    return withOwnerAndTarget(parsed.data.userId, async (ctx, target) => {
      try {
        await auth.api.setUserPassword({
          body: { userId: target.id, newPassword: parsed.data.newPassword },
          headers: ctx.headers,
        });
      } catch (err) {
        logError("resetMemberPassword", err, { input: { userId: target.id } });
        return {
          success: false,
          code: ErrorCode.INTERNAL_ERROR,
          error: "Không thể đặt lại mật khẩu, thử lại.",
        };
      }
      return { success: true, data: undefined };
    });
  },
);

export const banMember = withActionContext(
  "banMember",
  async (
    _prev: ActionResult | null,
    formData: FormData,
  ): Promise<ActionResult> => {
    const parsed = banMemberSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);

    return withOwnerAndTarget(parsed.data.userId, async (ctx, target) => {
      try {
        // Không truyền banExpiresIn = khóa vĩnh viễn tới khi mở.
        // banUser tự thu hồi toàn bộ session của target (đã xác minh 1.6.20).
        await auth.api.banUser({
          body: { userId: target.id, banReason: parsed.data.banReason },
          headers: ctx.headers,
        });
      } catch (err) {
        logError("banMember", err, { input: { userId: target.id } });
        return {
          success: false,
          code: ErrorCode.INTERNAL_ERROR,
          error: "Không thể khóa tài khoản, thử lại.",
        };
      }
      revalidatePath("/settings/users");
      return { success: true, data: undefined };
    });
  },
);

export const unbanMember = withActionContext(
  "unbanMember",
  async (
    _prev: ActionResult | null,
    formData: FormData,
  ): Promise<ActionResult> => {
    const parsed = memberIdSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);

    return withOwnerAndTarget(parsed.data.userId, async (ctx, target) => {
      try {
        await auth.api.unbanUser({
          body: { userId: target.id },
          headers: ctx.headers,
        });
      } catch (err) {
        logError("unbanMember", err, { input: { userId: target.id } });
        return {
          success: false,
          code: ErrorCode.INTERNAL_ERROR,
          error: "Không thể mở khóa tài khoản, thử lại.",
        };
      }
      revalidatePath("/settings/users");
      return { success: true, data: undefined };
    });
  },
);

export const deleteMember = withActionContext(
  "deleteMember",
  async (
    _prev: ActionResult | null,
    formData: FormData,
  ): Promise<ActionResult> => {
    const parsed = memberIdSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodActionError(parsed.error);

    return withOwnerAndTarget(parsed.data.userId, async (ctx, target) => {
      // Đã dính giao dịch → chặn xóa để giữ dấu người thực hiện (spec 4.5).
      if (await userHasTransactions(target.id)) {
        return {
          success: false,
          code: ErrorCode.CONFLICT,
          error: "Thành viên đã có giao dịch — hãy khóa thay vì xóa.",
        };
      }

      try {
        await auth.api.removeUser({
          body: { userId: target.id },
          headers: ctx.headers,
        });
      } catch (err) {
        logError("deleteMember", err, { input: { userId: target.id } });
        // FK từ transactions (user_id/updated_by) chặn xóa ở tầng DB — race
        // với guard phía trên → vẫn trả CONFLICT thay vì lỗi hệ thống.
        return {
          success: false,
          code: ErrorCode.CONFLICT,
          error: "Không thể xóa: thành viên đã có dữ liệu liên quan. Hãy khóa thay thế.",
        };
      }

      revalidatePath("/settings/users");
      return { success: true, data: undefined };
    });
  },
);
