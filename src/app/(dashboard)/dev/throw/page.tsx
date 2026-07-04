import { notFound } from "next/navigation";

// Route test-only cho verify-env (error-boundary.spec.ts) kích lỗi thật để
// kiểm chứng src/app/error.tsx global. Không tồn tại ở production.
export default function DevThrowPage() {
  if (process.env.NODE_ENV === "production") notFound();
  throw new Error("Lỗi cố ý để test error.tsx (chỉ dùng ở non-production).");
}
