import { z } from "zod";
import { ErrorCode, type ActionError, type ActionResult } from "@/lib/types";

/**
 * Tách lỗi từ kết quả Server Action cho form: lỗi theo field (hiển thị inline)
 * và lỗi cấp form (hiển thị Alert). Dùng chung cho mọi form useActionState.
 */
export function getFormError<T>(state: ActionResult<T> | null): {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
} {
  if (!state || state.success) return {};
  if (state.fieldErrors) return { fieldErrors: state.fieldErrors };
  return { formError: state.error };
}

/** Chuyển lỗi Zod thành ActionError (VALIDATION_ERROR + fieldErrors) — dùng chung ở mọi action. */
export function zodActionError(error: z.ZodError): ActionError {
  return {
    success: false,
    code: ErrorCode.VALIDATION_ERROR,
    error: "Dữ liệu không hợp lệ",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
  };
}
