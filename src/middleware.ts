import { auth } from "~/server/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isLoggedIn)
      return NextResponse.redirect(new URL("/login", nextUrl));
    if (role !== "ADMIN")
      return NextResponse.redirect(new URL("/todos", nextUrl));
  }

  if (nextUrl.pathname.startsWith("/todos")) {
    if (!isLoggedIn)
      return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (
    nextUrl.pathname === "/login" ||
    nextUrl.pathname === "/signup"
  ) {
    if (isLoggedIn)
      return NextResponse.redirect(new URL("/todos", nextUrl));
  }
});

export const config = {
  matcher: ["/todos/:path*", "/admin/:path*", "/login", "/signup"],
};
