// Admin utilities — uses ADMIN_EMAILS env var (comma-separated).
// No schema changes needed; admin status is env-driven.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Check if the given email is in the ADMIN_EMAILS list.
 */
export function isAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS ?? "";
  if (!raw) return false;
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

/**
 * Check if the current session user is an admin.
 * Returns the user ID if admin, null otherwise.
 */
export async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    throw new Error("Unauthorized");
  }
  if (!isAdminEmail(session.user.email)) {
    throw new Error("Forbidden");
  }
  return session.user.id;
}

/**
 * Check if a session user is admin (non-throwing variant).
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.email) return false;
  return isAdminEmail(session.user.email);
}

/**
 * Check if an email is on the whitelist.
 * Case-insensitive match.
 */
export async function isEmailWhitelisted(email: string): Promise<boolean> {
  const entry = await prisma.allowedEmail.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  return entry !== null;
}

/**
 * Check if any whitelist entries exist (used for UI decisions like
 * showing the register link on the login page).
 */
export async function hasWhitelistEntries(): Promise<boolean> {
  const count = await prisma.allowedEmail.count({ take: 1 });
  return count > 0;
}

/**
 * Remove a whitelisted email after successful registration (self-cleaning).
 */
export async function consumeWhitelistEntry(email: string): Promise<void> {
  await prisma.allowedEmail.deleteMany({
    where: { email: email.toLowerCase() },
  });
}
