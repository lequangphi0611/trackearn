import type { ActionResult } from "@/lib/types";

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
