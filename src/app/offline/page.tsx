import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-lg font-semibold">Mất kết nối mạng</p>
      <p className="text-muted-foreground">
        Không thể tải trang này. Kiểm tra kết nối mạng rồi thử lại.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
      >
        Thử lại
      </Link>
    </div>
  );
}
