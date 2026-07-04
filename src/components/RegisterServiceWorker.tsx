"use client";

import { useEffect } from "react";

// Chỉ đăng ký ở production — dev cần code mới nhất mỗi lần sửa, SW cache-first
// cho _next/static sẽ gây "code cũ" khó chịu nếu bật ở dev.
export const RegisterServiceWorker = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js");
  }, []);

  return null;
};
