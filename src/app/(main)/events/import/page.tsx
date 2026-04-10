import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getMsrAccount } from "@/lib/services/msr-authenticated-api";
import { extractPostalCode } from "@/lib/utils/extract-postal-code";
import { OrgImport } from "@/components/events/org-import";
import { MsrSearch } from "@/components/events/msr-search";
import { BackLink } from "@/components/shared/back-link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ImportEventsPage() {
  const userId = await requireAuth();

  const [existingEvents, userProfile, existingMsrEvents, msrAccount] =
    await Promise.all([
      prisma.event.findMany({
        where: { userId, registrationUrl: { not: null } },
        select: { registrationUrl: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { homeAddress: true },
      }),
      prisma.event.findMany({
        where: { userId, msrEventId: { not: null } },
        select: { msrEventId: true },
      }),
      getMsrAccount(userId),
    ]);

  const importedUrls = existingEvents
    .map((e) => e.registrationUrl)
    .filter((u): u is string => u !== null);

  const importedMsrIds = existingMsrEvents
    .map((e) => e.msrEventId)
    .filter((id): id is string => id !== null);

  const postalCode = userProfile?.homeAddress
    ? extractPostalCode(userProfile.homeAddress)
    : null;

  return (
    <div className="w-full max-w-2xl">
      <BackLink href="/events" label="Events" />
      <h1 className="text-2xl font-semibold mb-1">Find Events</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Search MotorsportReg for events near you, or import from a specific
        organization.
      </p>

      <Tabs defaultValue="search">
        <TabsList className="mb-6">
          <TabsTrigger value="search">Search MSR</TabsTrigger>
          <TabsTrigger value="org">Import from Org</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <MsrSearch
            importedUrls={importedUrls}
            importedMsrIds={importedMsrIds}
            defaultPostalCode={postalCode}
            hasMsrAccount={!!msrAccount}
          />
        </TabsContent>

        <TabsContent value="org">
          <OrgImport importedUrls={importedUrls} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
