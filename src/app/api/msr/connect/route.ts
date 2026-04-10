import { auth } from "@/lib/auth";
import {
  msrCredsPresent,
  getRequestToken,
  getAuthorizationUrl,
} from "@/lib/services/msr-oauth";
import { NextResponse } from "next/server";
import crypto from "crypto";

function signCookieValue(value: string): string {
  const secret = process.env.AUTH_SECRET ?? "";
  const sig = crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("base64url");
  return `${value}.${sig}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL("/login", process.env.AUTH_URL ?? "http://localhost:3000"),
    );
  }

  if (!msrCredsPresent()) {
    return NextResponse.json(
      { error: "MSR integration not configured" },
      { status: 404 },
    );
  }

  const callbackUrl =
    process.env.MSR_CALLBACK_URL ?? "http://localhost:3000/api/msr/callback";

  const tokens = await getRequestToken(callbackUrl);
  if (!tokens) {
    return NextResponse.json(
      { error: "Failed to obtain MSR request token" },
      { status: 502 },
    );
  }

  const response = NextResponse.redirect(
    getAuthorizationUrl(tokens.oauthToken),
  );

  // Store the request token secret in a signed HTTP-only cookie (10 min TTL).
  // The token itself comes back in the callback query string.
  const cookieValue = signCookieValue(tokens.oauthTokenSecret);
  response.cookies.set("msr_rts", cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
