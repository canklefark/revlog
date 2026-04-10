// Server-only — never import this from client components.
// OAuth 1.0a signing client for MotorsportReg.com.
// All functions return null on failure — never throw.
import "server-only";

import crypto from "crypto";
import OAuth from "oauth-1.0a";

const MSR_API_BASE = "https://api.motorsportreg.com";
const MSR_AUTH_BASE = "https://www.motorsportreg.com";

// ─── Type guards ─────────────────────────────────────────────────────────────

interface RequestTokenResponse {
  oauthToken: string;
  oauthTokenSecret: string;
}

interface AccessTokenResponse {
  accessToken: string;
  accessTokenSecret: string;
  profileId: string;
}

function parseFormEncoded(body: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of body.split("&")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const key = decodeURIComponent(pair.slice(0, eq));
    const value = decodeURIComponent(pair.slice(eq + 1));
    result[key] = value;
  }
  return result;
}

function isRequestTokenResponse(v: unknown): v is RequestTokenResponse {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.oauthToken === "string" &&
    typeof obj.oauthTokenSecret === "string"
  );
}

function isAccessTokenResponse(v: unknown): v is AccessTokenResponse {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.accessToken === "string" &&
    typeof obj.accessTokenSecret === "string" &&
    typeof obj.profileId === "string"
  );
}

// ─── OAuth client factory ─────────────────────────────────────────────────────

function makeOAuthClient(): OAuth | null {
  const key = process.env.MSR_CONSUMER_KEY;
  const secret = process.env.MSR_CONSUMER_SECRET;
  if (!key || !secret) return null;

  return new OAuth({
    consumer: { key, secret },
    signature_method: "HMAC-SHA1",
    hash_function(base_string: string, signingKey: string): string {
      return crypto
        .createHmac("sha1", signingKey)
        .update(base_string)
        .digest("base64");
    },
  });
}

// ─── Public guards / helpers ─────────────────────────────────────────────────

export function msrCredsPresent(): boolean {
  return Boolean(
    process.env.MSR_CONSUMER_KEY && process.env.MSR_CONSUMER_SECRET,
  );
}

export function getAuthorizationUrl(requestToken: string): string {
  return `${MSR_AUTH_BASE}/index.cfm/event/oauth?oauth_token=${encodeURIComponent(requestToken)}`;
}

// ─── Token exchange ───────────────────────────────────────────────────────────

/**
 * Step 1 of OAuth dance: obtain a temporary request token.
 * Signed with consumer credentials only (no user token yet).
 */
export async function getRequestToken(
  callbackUrl: string,
): Promise<RequestTokenResponse | null> {
  const oauth = makeOAuthClient();
  if (!oauth) return null;

  const url = `${MSR_API_BASE}/rest/tokens/request`;

  try {
    const authHeader = oauth.toHeader(
      oauth.authorize({
        url,
        method: "POST",
        data: { oauth_callback: callbackUrl },
      }),
    );

    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...authHeader,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(
        `[msr-oauth] request token failed: ${res.status} ${res.statusText}`,
        errBody,
      );
      return null;
    }

    const body = await res.text();
    const parsed = parseFormEncoded(body);

    const result = {
      oauthToken: parsed["oauth_token"] ?? "",
      oauthTokenSecret: parsed["oauth_token_secret"] ?? "",
    };

    if (!isRequestTokenResponse(result) || !result.oauthToken) return null;
    return result;
  } catch {
    return null;
  }
}

/**
 * Step 4 of OAuth dance: exchange request token + verifier for a permanent access token.
 */
export async function getAccessToken(
  requestToken: string,
  requestTokenSecret: string,
  oauthVerifier: string,
): Promise<AccessTokenResponse | null> {
  const oauth = makeOAuthClient();
  if (!oauth) return null;

  const url = `${MSR_API_BASE}/rest/tokens/access`;

  try {
    const token = { key: requestToken, secret: requestTokenSecret };
    const authHeader = oauth.toHeader(
      oauth.authorize(
        { url, method: "POST", data: { oauth_verifier: oauthVerifier } },
        token,
      ),
    );

    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...authHeader,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(
        `[msr-oauth] access token failed: ${res.status} ${res.statusText}`,
        errBody,
      );
      return null;
    }

    const body = await res.text();
    const parsed = parseFormEncoded(body);

    const result = {
      accessToken: parsed["oauth_token"] ?? "",
      accessTokenSecret: parsed["oauth_token_secret"] ?? "",
      profileId:
        parsed["profile_id"] ?? parsed["profileid"] ?? parsed["user_id"] ?? "",
    };

    if (!isAccessTokenResponse(result) || !result.accessToken) return null;
    return result;
  } catch {
    return null;
  }
}

// ─── Signed API fetch ─────────────────────────────────────────────────────────

/**
 * Make an OAuth 1.0a request signed with consumer credentials only (no user token).
 * Used for endpoints that accept app-level auth rather than user-delegated auth.
 */
export async function msrFetchAppOnly(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  extraHeaders?: Record<string, string>,
): Promise<Response | null> {
  const oauth = makeOAuthClient();
  if (!oauth) return null;

  const url = path.startsWith("http") ? path : `${MSR_API_BASE}${path}`;

  try {
    const authHeader = oauth.toHeader(oauth.authorize({ url, method }));

    const res = await fetch(url, {
      method,
      headers: {
        ...authHeader,
        Accept: "application/vnd.pukkasoft+json",
        ...extraHeaders,
      },
      signal: AbortSignal.timeout(15000),
    });

    return res;
  } catch {
    return null;
  }
}

/**
 * Make a signed OAuth 1.0a request to the MSR API.
 * Returns Response or null on any error. Never throws.
 */
export async function msrFetch(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  accessToken: string,
  accessTokenSecret: string,
  extraHeaders?: Record<string, string>,
): Promise<Response | null> {
  const oauth = makeOAuthClient();
  if (!oauth) return null;

  const url = path.startsWith("http") ? path : `${MSR_API_BASE}${path}`;

  try {
    const token = { key: accessToken, secret: accessTokenSecret };
    const authHeader = oauth.toHeader(oauth.authorize({ url, method }, token));

    const res = await fetch(url, {
      method,
      headers: {
        ...authHeader,
        Accept: "application/vnd.pukkasoft+json",
        ...extraHeaders,
      },
      signal: AbortSignal.timeout(15000),
    });

    return res;
  } catch {
    return null;
  }
}
