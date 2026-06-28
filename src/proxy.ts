import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_ROUTES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // Optimistic: chỉ kiểm tra sự tồn tại của cookie session, KHÔNG query DB ở edge.
  // Xác thực thật (và phân quyền role) do server component đảm nhận khi render.
  const hasSession = Boolean(getSessionCookie(request));

  const isAuthRoute = AUTH_ROUTES.includes(pathname); // khớp chính xác, tránh /login-help

  // Đã đăng nhập mà vào trang auth → về dashboard.
  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Chưa đăng nhập mà vào trang được bảo vệ → về login kèm callbackURL.
  if (!hasSession && !isAuthRoute) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackURL", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Bỏ qua toàn bộ /api (tự lo auth, trả JSON), asset Next & file tĩnh.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|icons).*)",
  ],
};
