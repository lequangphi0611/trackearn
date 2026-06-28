import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Lấy session hiện tại, dedupe trong cùng một request (React cache):
 * layout + page gọi nhiều lần chỉ xác thực 1 lần.
 */
export const getCurrentSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});
