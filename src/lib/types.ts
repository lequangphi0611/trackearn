export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export type ActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      code: ErrorCode;
      fieldErrors?: Record<string, string[]>;
    };

// Nhánh lỗi (không phụ thuộc T) — dùng cho helper trả lỗi chung.
export type ActionError = {
  success: false;
  error: string;
  code: ErrorCode;
  fieldErrors?: Record<string, string[]>;
};
