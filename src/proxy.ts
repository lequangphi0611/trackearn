import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_ROUTES = ["/login", "/register"];

// Trang chẩn đoán /admin dành cho DEV — HTTP Basic Auth qua env, HOÀN TOÀN
// tách Better Auth (owner/khách không có quyền). Trả 401 nếu thiếu/sai creds.
function unauthorized(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="TrackEarn admin"' },
  });
}

function checkAdminBasicAuth(request: NextRequest): NextResponse | null {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  // Chưa cấu hình creds → khóa cứng (không để hớ hênh mở /admin).
  if (!user || !pass) return unauthorized();

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();
  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }
  const sep = decoded.indexOf(":");
  if (sep === -1) return unauthorized();
  const gotUser = decoded.slice(0, sep);
  const gotPass = decoded.slice(sep + 1);
  if (gotUser !== user || gotPass !== pass) return unauthorized();
  return null; // hợp lệ
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // /admin: Basic Auth riêng, return sớm — không đụng logic Better Auth.
  if (pathname.startsWith("/admin")) {
    const denied = checkAdminBasicAuth(request);
    if (denied) return denied;
    return NextResponse.next();
  }
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
