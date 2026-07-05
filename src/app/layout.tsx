import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrackEarn",
  description: "Sổ thu chi cho hộ kinh doanh",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#E0A020",
};

// Chạy TRƯỚC hydration để không chớp sáng/tối sai theme (FOUC).
// localStorage.theme: "light" | "dark"; không có = theo hệ thống.
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var dark=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
      // class "dark" do script dưới set trước hydration → server không biết.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        {/* Root layout (không phải chỉ (dashboard)) — SW phải đăng ký được
            ngay từ trang login/register, không chỉ sau khi vào dashboard. */}
        <RegisterServiceWorker />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
