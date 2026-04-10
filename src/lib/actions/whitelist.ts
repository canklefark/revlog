"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

export type WhitelistActionState = {
  error?: string;
  data?: true;
};

const addEmailSchema = z.object({
  email: z.string().email("Invalid email address."),
  note: z.string().max(200).optional(),
});

export async function addWhitelistEmail(
  _prevState: WhitelistActionState,
  formData: FormData,
): Promise<WhitelistActionState> {
  await requireAdmin();

  const parsed = addEmailSchema.safeParse({
    email: formData.get("email"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const email = parsed.data.email.toLowerCase();

  // Check if already whitelisted.
  const existing = await prisma.allowedEmail.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { error: "This email is already on the whitelist." };
  }

  // Check if already registered.
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (user) {
    return { error: "This email already has an account." };
  }

  await prisma.allowedEmail.create({
    data: {
      email,
      note: parsed.data.note ?? null,
    },
  });

  revalidatePath("/settings/whitelist");
  return { data: true };
}

export async function removeWhitelistEmail(
  _prevState: WhitelistActionState,
  formData: FormData,
): Promise<WhitelistActionState> {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string") {
    return { error: "Missing email ID." };
  }

  await prisma.allowedEmail.deleteMany({ where: { id } });

  revalidatePath("/settings/whitelist");
  return { data: true };
}
