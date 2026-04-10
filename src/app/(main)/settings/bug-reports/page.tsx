import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { BugReportsList } from "@/components/settings/bug-reports-list";
import { BackLink } from "@/components/shared/back-link";

export default async function BugReportsPage() {
  await requireAdmin();

  const reports = await prisma.bugReport.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      status: true,
      adminNote: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  const open = reports.filter((r) => r.status === "open").length;

  return (
    <div>
      <BackLink href="/settings" label="Settings" />
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold">Bug Reports</h1>
        {open > 0 && (
          <span className="text-sm text-destructive font-medium">
            {open} open
          </span>
        )}
      </div>
      <BugReportsList reports={reports} />
    </div>
  );
}
