"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  syncMsrEvents,
  disconnectMsr,
  type MsrSyncState,
} from "@/lib/actions/msr-sync";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Props {
  hasMsrCreds: boolean;
  isMsrConnected: boolean;
  initialError?: string | null;
}

const initialState: MsrSyncState = {};

export function MsrConnectCard({
  hasMsrCreds,
  isMsrConnected,
  initialError,
}: Props) {
  const [syncState, syncAction, isSyncing] = useActionState(
    syncMsrEvents,
    initialState,
  );
  const [disconnectState, disconnectAction, isDisconnecting] = useActionState(
    disconnectMsr,
    initialState,
  );
  useEffect(() => {
    if (initialError) toast.error(initialError);
  }, [initialError]);

  useEffect(() => {
    if (syncState.data) {
      const { created, matched } = syncState.data;
      toast.success(
        `Sync complete — ${created} new event${created !== 1 ? "s" : ""} added, ${matched} matched.`,
      );
    }
    if (syncState.error) toast.error(syncState.error);
  }, [syncState]);

  useEffect(() => {
    if (disconnectState.data)
      toast.success("MotorsportReg account disconnected.");
    if (disconnectState.error) toast.error(disconnectState.error);
  }, [disconnectState]);

  if (!hasMsrCreds) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">MotorsportReg</CardTitle>
          <CardDescription>
            Sync your event registrations from MotorsportReg.com.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Set <code className="font-mono text-xs">MSR_CONSUMER_KEY</code> and{" "}
            <code className="font-mono text-xs">MSR_CONSUMER_SECRET</code> in
            your environment variables to enable this integration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">MotorsportReg</CardTitle>
            <CardDescription>
              {isMsrConnected
                ? "Your MotorsportReg account is connected."
                : "Connect your MotorsportReg account to sync event registrations."}
            </CardDescription>
          </div>
          <Badge variant={isMsrConnected ? "default" : "secondary"}>
            {isMsrConnected ? "Connected" : "Not connected"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {!isMsrConnected ? (
          <a href="/api/msr/connect">
            <Button type="button">Connect MotorsportReg</Button>
          </a>
        ) : (
          <>
            <div>
              <p className="text-sm text-muted-foreground">
                Sync your registered events from MotorsportReg into RevLog.
                Already-imported events are matched and skipped.
              </p>
            </div>

            <form action={syncAction}>
              <Button type="submit" disabled={isSyncing}>
                {isSyncing ? "Syncing…" : "Sync My Events"}
              </Button>
            </form>

            <Separator />

            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Disconnect</p>
              <p className="text-xs text-muted-foreground">
                Removes your MotorsportReg connection. Your existing events are
                not deleted.
              </p>
              <form action={disconnectAction} className="mt-2">
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? "Disconnecting…" : "Disconnect"}
                </Button>
              </form>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
