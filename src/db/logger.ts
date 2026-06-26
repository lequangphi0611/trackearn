import { logger } from "@/lib/logger";
import { getRequestContext } from "@/lib/request-context";
import { SLOW_QUERY_MS } from "@/lib/constants";

// SQL logging cho Drizzle bằng cách bọc client postgres-js.
//
// Vì sao bọc client thay vì dùng Drizzle `Logger`: interface Logger.logQuery
// được gọi TRƯỚC khi query chạy nên không có duration → không phát hiện được
// query chậm. Bọc `client.unsafe` (điểm thực thi thật của driver postgres-js,
// xem drizzle-orm/postgres-js/session) cho phép đo thời gian quanh promise.
//
// Quy tắc log (đã chốt):
//   - Dev:  log MỌI query + params + durationMs (debug).
//   - Prod: chỉ log query CHẬM (> SLOW_QUERY_MS) hoặc LỖI, KHÔNG kèm params
//           (tránh lộ số tiền/PII vào file log).

const isProd = process.env.NODE_ENV === "production";

function logQuery(
  sql: string,
  params: readonly unknown[],
  durationMs: number,
  error: unknown,
): void {
  const ctx = getRequestContext();
  const base = {
    requestId: ctx?.requestId,
    action: ctx?.action,
    userId: ctx?.userId,
    sql,
    durationMs: Math.round(durationMs),
  };

  if (error) {
    logger.error({ ...base, err: error }, "query failed");
    return;
  }
  if (isProd) {
    if (durationMs > SLOW_QUERY_MS) logger.warn(base, "slow query");
    return; // prod: query thường không log, không kèm params
  }
  logger.debug({ ...base, params }, "query"); // dev: mọi query + params
}

// Bọc đối tượng PendingQuery của postgres-js. Chỉ đo khi consumer thực sự
// `await` (qua then/catch/finally) — KHÔNG tự subscribe để tránh kích hoạt
// thực thi sớm làm hỏng `.values()` (phải gọi trước khi query chạy).
function instrumentPending<T extends object>(
  pending: T,
  sql: string,
  params: readonly unknown[],
  start: number,
): T {
  let settled = false;
  const settle = (error: unknown) => {
    if (settled) return;
    settled = true;
    logQuery(sql, params, performance.now() - start, error);
  };

  return new Proxy(pending, {
    get(target, prop, receiver) {
      if (prop === "then") {
        return (
          onFulfilled?: (value: unknown) => unknown,
          onRejected?: (reason: unknown) => unknown,
        ) =>
          (target as PromiseLike<unknown>).then(
            (value) => {
              settle(null);
              return onFulfilled ? onFulfilled(value) : value;
            },
            (reason) => {
              settle(reason);
              return onRejected ? onRejected(reason) : Promise.reject(reason);
            },
          );
      }
      // Định tuyến catch/finally qua proxy.then để vẫn đo được thời gian.
      if (prop === "catch") {
        return (onRejected?: (reason: unknown) => unknown) =>
          (receiver as PromiseLike<unknown>).then(undefined, onRejected);
      }
      if (prop === "finally") {
        return (onFinally?: () => void) =>
          (receiver as Promise<unknown>).then(
            (value) => {
              onFinally?.();
              return value;
            },
            (reason) => {
              onFinally?.();
              throw reason;
            },
          );
      }

      const value = Reflect.get(target, prop, target);
      // .values()/.raw()/.execute()… trả về pending mới → bọc lại, giữ nguyên start.
      if (typeof value === "function") {
        return (...args: unknown[]) => {
          const result = (value as (...a: unknown[]) => unknown).apply(
            target,
            args,
          );
          return result &&
            typeof (result as { then?: unknown }).then === "function"
            ? instrumentPending(result as object, sql, params, start)
            : result;
        };
      }
      return value;
    },
  });
}

type AnyClient = Record<string, unknown> & {
  unsafe: (query: string, params?: unknown[], options?: unknown) => object;
  begin: (...args: unknown[]) => unknown;
  savepoint?: (...args: unknown[]) => unknown;
};

/**
 * Bọc client postgres-js để đo + log mọi query. Bọc đệ quy client con trong
 * begin()/savepoint() để query trong transaction cũng được log.
 */
export function instrumentClient<T extends object>(client: T): T {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (prop === "unsafe") {
        return (query: string, params?: unknown[], options?: unknown) => {
          const start = performance.now();
          const pending = (value as AnyClient["unsafe"]).call(
            target,
            query,
            params,
            options,
          );
          return instrumentPending(pending, query, params ?? [], start);
        };
      }

      // begin/savepoint nhận callback có client riêng cho transaction → bọc lại.
      if (prop === "begin" || prop === "savepoint") {
        return (...args: unknown[]) => {
          const cb = args[args.length - 1];
          if (typeof cb === "function") {
            const original = cb as (c: object) => unknown;
            args[args.length - 1] = (txClient: object) =>
              original(instrumentClient(txClient));
          }
          return (value as (...a: unknown[]) => unknown).apply(target, args);
        };
      }

      return typeof value === "function"
        ? (value as (...a: unknown[]) => unknown).bind(target)
        : value;
    },
  });
}
