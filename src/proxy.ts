import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/env";

const NO_STORE = "private, no-store, no-cache, max-age=0, must-revalidate";

function withNoStore(response: NextResponse) {
  response.headers.set("Cache-Control", NO_STORE);
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith("/painel") ||
    path.startsWith("/admin") ||
    path.startsWith("/alterar-senha");

  if (isProtected && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return withNoStore(NextResponse.redirect(redirectUrl));
  }

  if (isProtected || path.startsWith("/login") || path.startsWith("/api/session")) {
    return withNoStore(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
