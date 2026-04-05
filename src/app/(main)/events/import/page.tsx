import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { OrgImport } from "@/components/events/org-import";
import { BackLink } from "@/components/shared/back-link";

export default async function ImportEventsPage() {
  const userId = await requireAuth();

  // Pass existing registrationUrls so the UI can mark already-imported events
  const existingEvents = await prisma.event.findMany({
    where: { userId, registrationUrl: { not: null } },
    select: { registrationUrl: true },
  });

  const importedUrls = existingEvents
    .map((e) => e.registrationUrl)
    .filter((u): u is string => u !== null);

  return (
    <div className="w-full max-w-2xl">
      <BackLink href="/events" label="Events" />
      <h1 className="text-2xl font-semibold mb-1">Import Events</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Paste a MotorsportReg organization URL to browse and bulk-add their
        upcoming events.
      </p>
      <OrgImport importedUrls={importedUrls} />
    </div>
  );
}
