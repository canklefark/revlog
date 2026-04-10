import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { WhitelistManager } from "@/components/settings/whitelist-manager";
import { BackLink } from "@/components/shared/back-link";

export default async function WhitelistPage() {
  await requireAdmin();

  const entries = await prisma.allowedEmail.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, note: true, createdAt: true },
  });

  return (
    <div>
      <BackLink href="/settings" label="Settings" />
      <h1 className="mb-2 text-2xl font-semibold">Registration Whitelist</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Add emails to allow specific people to register when registration is
        disabled. Entries are automatically removed after the person signs up.
      </p>

      <WhitelistManager entries={entries} />
    </div>
  );
}
