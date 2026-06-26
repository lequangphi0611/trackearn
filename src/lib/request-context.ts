import { AsyncLocalStorage } from "node:async_hooks";

// Context theo từng request/server-action, để logger (SQL + lỗi) tự gắn
// requestId/action/userId mà không phải truyền tay qua từng hàm.
// `userId` mutable: set sau bước auth (xem setUserId).
export type RequestContext = {
  requestId: string;
  action: string;
  userId?: string;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();

/** Context của request hiện tại (undefined nếu chạy ngoài withActionContext). */
export function getRequestContext(): RequestContext | undefined {
  return requestContext.getStore();
}

/** Gắn userId vào context hiện tại — gọi ngay sau getCurrentSession(). */
export function setUserId(userId: string): void {
  const store = requestContext.getStore();
  if (store) store.userId = userId;
}

/** Chạy `fn` trong một context mới; tự sinh requestId nếu chưa có. */
export function runWithContext<T>(
  ctx: { action: string; requestId?: string; userId?: string },
  fn: () => T,
): T {
  return requestContext.run(
    {
      requestId: ctx.requestId ?? crypto.randomUUID(),
      action: ctx.action,
      userId: ctx.userId,
    },
    fn,
  );
}
