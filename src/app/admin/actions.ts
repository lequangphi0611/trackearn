"use server";

import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/db";
import { account, session, user } from "@/db/schema";
import { withActionContext } from "@/lib/action-context";
import { setUserId } from "@/lib/request-context";
import { logError, logWarn } from "@/lib/logger";
import { ErrorCode, type ActionResult } from "@/lib/types";
import { zodActionError } from "@/lib/form";
import { resetOwnerPasswordSchema } from "./schema";

/**
 * /admin gác bằng HTTP Basic Auth ở proxy.ts (tách hẳn Better Auth). Server
 * action cũng POST về /admin nên đã đi qua Basic Auth của proxy, nhưng re-check
 * ở đây để phòng thủ nhiều lớp — không dựa mỗi vào matcher. Logic khớp
 * proxy.ts:checkAdminBasicAuth.
 */
function hasValidBasicAuth(h: Headers): boolean {
  const u = process.env.ADMIN_USER;
  const p = process.env.ADMIN_PASS;
  if (!u || !p) return false;
  const header = h.get("authorization");
  if (!header?.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  if (sep === -1) return false;
  return decoded.slice(0, sep) === u && decoded.slice(sep + 1) === p;
}

/**
 * Đặt lại mật khẩu cho tài khoản chủ shop (role=owner) — cửa mở khóa khi owner
 * quên mật khẩu. KHÔNG dùng auth.api.setUserPassword (cần session admin, mà ở
 * đây chỉ có Basic Auth): hash trực tiếp bằng hashPassword của Better Auth rồi
 * ghi thẳng account.password (dòng providerId='credential') — cùng thuật toán
 * scrypt mà signIn/changePassword verify, nên đăng nhập lại được ngay.
 */
export const resetOwnerPassword = withActionContext(
  "resetOwnerPassword",
  async (
    _prev: ActionResult | null,
    formData: FormData,
  ): Promise<ActionResult> => {
    const h = await headers();
    if (!hasValidBasicAuth(h)) {
      return {
        success: false,
        code: ErrorCode.AUTH_ERROR,
        error: "Bạn không có quyền thực hiện thao tác này.",
      };
    }

    const parsed = resetOwnerPasswordSchema.safeParse(
      Object.fromEntries(formData),
    );
    if (!parsed.success) return zodActionError(parsed.error);

    // Chỉ cho reset tài khoản owner: member đã có đường reset trong app
    // (/settings/users). Scope vào owner để trang này đúng mục đích cứu chủ shop.
    const target = await db.query.user.findFirst({
      where: eq(user.email, parsed.data.email),
    });
    if (!target || target.role !== "owner") {
      logWarn("resetOwnerPassword", `no owner for email=${parsed.data.email}`);
      return {
        success: false,
        code: ErrorCode.NOT_FOUND,
        error: "Không tìm thấy chủ shop với email này.",
      };
    }
    setUserId(target.id);

    try {
      const hash = await hashPassword(parsed.data.newPassword);

      const updated = await db
        .update(account)
        .set({ password: hash })
        .where(
          and(
            eq(account.userId, target.id),
            eq(account.providerId, "credential"),
          ),
        )
        .returning({ id: account.id });

      // Owner đăng ký qua signUpEmail nên luôn có dòng credential; 0 dòng là bất
      // thường (vd tài khoản chỉ OAuth) → báo rõ thay vì im lặng "thành công".
      if (updated.length === 0) {
        logError("resetOwnerPassword", new Error("no credential account"), {
          input: { userId: target.id },
        });
        return {
          success: false,
          code: ErrorCode.CONFLICT,
          error: "Tài khoản chủ shop không dùng mật khẩu để đăng nhập.",
        };
      }

      // Thu hồi mọi session cũ của owner: buộc đăng nhập lại bằng mật khẩu mới.
      await db.delete(session).where(eq(session.userId, target.id));
    } catch (err) {
      logError("resetOwnerPassword", err, {
        input: { email: parsed.data.email },
      });
      return {
        success: false,
        code: ErrorCode.INTERNAL_ERROR,
        error: "Không thể đặt lại mật khẩu, thử lại.",
      };
    }

    return { success: true, data: undefined };
  },
);
