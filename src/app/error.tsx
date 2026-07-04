"use client";

export default function GlobalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-destructive">Đã có lỗi xảy ra.</p>
      <button onClick={reset}>Thử lại</button>
    </div>
  );
}
