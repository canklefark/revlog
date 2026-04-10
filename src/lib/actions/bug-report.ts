"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  BUG_REPORT_CATEGORIES,
  BUG_REPORT_STATUSES,
} from "@/lib/constants/bug-report-types";

export interface BugReportActionState {
  data?: { id: string };
  error?: string;
}

const submitSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required.")
    .max(200, "Title must be 200 characters or fewer."),
  description: z
    .string()
    .min(1, "Description is required.")
    .max(5000, "Description must be 5000 characters or fewer."),
  category: z.enum(BUG_REPORT_CATEGORIES),
});

export async function submitBugReport(
  _prev: BugReportActionState,
  formData: FormData,
): Promise<BugReportActionState> {
  const userId = await requireAuth();

  const parsed = submitSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const report = await prisma.bugReport.create({
    data: { userId, ...parsed.data },
    select: { id: true },
  });

  return { data: { id: report.id } };
}

export interface AdminBugReportActionState {
  data?: true;
  error?: string;
}

const updateSchema = z.object({
  id: z.string().min(1, "Missing report ID."),
  status: z.enum(BUG_REPORT_STATUSES),
  adminNote: z.string().max(1000).optional(),
});

export async function updateBugReportStatus(
  _prev: AdminBugReportActionState,
  formData: FormData,
): Promise<AdminBugReportActionState> {
  await requireAdmin();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    adminNote: formData.get("adminNote") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.bugReport.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      adminNote: parsed.data.adminNote ?? null,
    },
  });

  revalidatePath("/settings/bug-reports");
  return { data: true };
}
