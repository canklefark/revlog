import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { msrCredsPresent } from "@/lib/services/msr-oauth";
import { MsrConnectCard } from "@/components/settings/msr-connect-card";
import { BackLink } from "@/components/shared/back-link";

const ERROR_MESSAGES: Record<string, string> = {
  msr_denied: "MotorsportReg authorization was denied or cancelled.",
  msr_expired:
    "The MotorsportReg authorization session expired. Please try again.",
  msr_token_failed:
    "Failed to complete MotorsportReg authorization. Please try again.",
};

interface Props {
  searchParams: Promise<Record<string, string>>;
}

export default async function IntegrationsPage({ searchParams }: Props) {
  const userId = await requireAuth();
  const params = await searchParams;

  const msrAccount = await prisma.account.findFirst({
    where: { userId, provider: "motorsportreg" },
    select: { id: true },
  });

  const errorKey = params.error;
  const initialError = errorKey
    ? (ERROR_MESSAGES[errorKey] ?? "Something went wrong.")
    : null;

  return (
    <div>
      <BackLink href="/settings" label="Settings" />
      <h1 className="mb-2 text-2xl font-semibold">Integrations</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Connect third-party services to sync your event data.
      </p>

      <MsrConnectCard
        hasMsrCreds={msrCredsPresent()}
        isMsrConnected={msrAccount !== null}
        initialError={initialError}
      />
    </div>
  );
}
