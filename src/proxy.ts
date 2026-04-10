import { auth } from "@/lib/auth";

export const proxy = auth;

export const config = {
  matcher: [
    "/((?!api/auth|api/health|api/msr|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
};
