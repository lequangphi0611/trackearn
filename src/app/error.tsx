"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  void error; // không log ở client — lỗi đã được log phía server (docs/rules/error-handling.md)
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-destructive">Đã có lỗi xảy ra.</p>
      <button onClick={reset}>Thử lại</button>
    </div>
  );
}
