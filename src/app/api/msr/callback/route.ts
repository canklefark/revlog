import { auth } from "@/lib/auth";
import { getAccessToken } from "@/lib/services/msr-oauth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

function verifyCookieValue(signed: string): string | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;
  const value = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);
  const secret = process.env.AUTH_SECRET ?? "";
  // Compare raw digest bytes (always 32 bytes) to avoid length-based timing leak.
  const expected = crypto.createHmac("sha256", secret).update(value).digest(); // Buffer — 32 bytes constant
  const sigBuf = Buffer.from(sig, "base64url");
  if (sigBuf.length !== 32) return null; // 32 is a constant, not attacker-controlled
  if (!crypto.timingSafeEqual(sigBuf, expected)) return null;
  return value;
}

export async function GET(request: NextRequest) {
  // Auth check first per project rules.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", BASE_URL));
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const oauthToken = searchParams.get("oauth_token");
  const oauthVerifier = searchParams.get("oauth_verifier");

  if (!oauthToken || !oauthVerifier) {
    return NextResponse.redirect(
      new URL("/settings/integrations?error=msr_denied", BASE_URL),
    );
  }

  // Retrieve and clear the request token secret from the signed cookie.
  const signedCookie = request.cookies.get("msr_rts")?.value ?? "";
  const requestTokenSecret = verifyCookieValue(signedCookie);

  const clearCookie = (res: NextResponse) => {
    res.cookies.set("msr_rts", "", { maxAge: 0, path: "/" });
    return res;
  };

  if (!requestTokenSecret) {
    const res = NextResponse.redirect(
      new URL("/settings/integrations?error=msr_expired", BASE_URL),
    );
    return clearCookie(res);
  }

  const tokens = await getAccessToken(
    oauthToken,
    requestTokenSecret,
    oauthVerifier,
  );
  if (!tokens) {
    const res = NextResponse.redirect(
      new URL("/settings/integrations?error=msr_token_failed", BASE_URL),
    );
    return clearCookie(res);
  }

  // Upsert the MSR Account record for this user.
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "motorsportreg",
        providerAccountId: tokens.profileId,
      },
    },
    update: {
      access_token: tokens.accessToken,
      access_token_secret: tokens.accessTokenSecret,
      userId,
    },
    create: {
      provider: "motorsportreg",
      providerAccountId: tokens.profileId,
      type: "oauth",
      access_token: tokens.accessToken,
      access_token_secret: tokens.accessTokenSecret,
      userId,
    },
  });

  const res = NextResponse.redirect(
    new URL("/settings/integrations?success=msr_connected", BASE_URL),
  );
  return clearCookie(res);
}
