export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      code: ErrorCode;
      fieldErrors?: Record<string, string[]>;
    };
