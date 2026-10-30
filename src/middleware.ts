import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        return token !== null;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/menu/:path*", "/game/:path*", "/collection/:path*", "/shop/:path*", "/profile/:path*",
    "/battle/:path*", "/decks/:path*", "/packs/:path*", "/starter-decks/:path*"],
};
