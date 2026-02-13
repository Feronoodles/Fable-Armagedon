import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        if (
          req.nextUrl.pathname.startsWith("/menu") ||
          req.nextUrl.pathname.startsWith("/game") ||
          req.nextUrl.pathname.startsWith("/collection") ||
          req.nextUrl.pathname.startsWith("/shop") ||
          req.nextUrl.pathname.startsWith("/profile")
        ) {
          return token !== null;
        }
        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/menu/:path*", "/game/:path*", "/collection/:path*", "/shop/:path*", "/profile/:path*"],
};