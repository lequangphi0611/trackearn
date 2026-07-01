import type { Metadata } from "next";

// Khung tối giản cho trang chẩn đoán DEV — không branding, không nav app.
// Auth do proxy.ts (Basic Auth) lo, không dùng Better Auth ở đây.
export const metadata: Metadata = {
  title: "TrackEarn — Chẩn đoán",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">{children}</main>
  );
}
