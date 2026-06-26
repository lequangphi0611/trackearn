import { runWithContext } from "./request-context";

// Bọc một server action (signature của useActionState: (prev, formData))
// để chạy trong một request context mới — tự sinh requestId, gắn tên action.
// Logger SQL và logError sẽ tự đọc context này.
//
// Dùng:
//   export const createTransaction = withActionContext(
//     "createTransaction",
//     async (_prev, formData) => { ... },
//   );
//
// Sau bước getCurrentSession() trong thân action, gọi setUserId(session.user.id)
// để enrich context (xem request-context.ts).
export function withActionContext<Prev, R>(
  action: string,
  fn: (prev: Prev, formData: FormData) => Promise<R>,
): (prev: Prev, formData: FormData) => Promise<R> {
  return (prev, formData) =>
    runWithContext({ action }, () => fn(prev, formData));
}
