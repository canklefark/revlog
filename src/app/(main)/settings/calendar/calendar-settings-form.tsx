"use client";

import { useActionState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { updateCalendarSettings } from "@/lib/actions/user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface CalendarOption {
  id: string;
  summary: string;
}

interface CurrentSettings {
  calendarSyncEnabled: boolean;
  calendarId: string | null;
  calendarProvider: string | null;
}

interface Props {
  hasGoogleCreds: boolean;
  isGoogleConnected: boolean;
  calendars: CalendarOption[];
  currentSettings: CurrentSettings;
}

const initialState = { data: undefined, error: undefined };

export function CalendarSettingsForm({
  hasGoogleCreds,
  isGoogleConnected,
  calendars,
  currentSettings,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    updateCalendarSettings,
    initialState,
  );

  useEffect(() => {
    if (state.data) toast.success("Calendar settings saved.");
    if (state.error) toast.error(state.error);
  }, [state]);

  // If Google OAuth credentials are not configured, show a notice.
  if (!hasGoogleCreds) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendar Sync</CardTitle>
          <CardDescription>
            Calendar sync requires Google OAuth credentials to be configured.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Set <code className="font-mono text-xs">GOOGLE_CLIENT_ID</code> and{" "}
            <code className="font-mono text-xs">GOOGLE_CLIENT_SECRET</code> in
            your environment variables to enable this feature.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Connection status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Google Calendar</CardTitle>
              <CardDescription>
                {isGoogleConnected
                  ? "Your Google account is connected."
                  : "Connect your Google account to enable calendar sync."}
              </CardDescription>
            </div>
            <Badge variant={isGoogleConnected ? "default" : "secondary"}>
              {isGoogleConnected ? "Connected" : "Not connected"}
            </Badge>
          </div>
        </CardHeader>
        {!isGoogleConnected && (
          <CardContent>
            <Button
              type="button"
              onClick={() =>
                signIn("google", { callbackUrl: "/settings/calendar" })
              }
            >
              Connect Google Calendar
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Settings form — only shown when connected */}
      {isGoogleConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sync Settings</CardTitle>
            <CardDescription>
              Choose which calendar to sync events to and toggle auto-sync.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="flex flex-col gap-5">
              {/* Hidden provider field */}
              <input type="hidden" name="calendarProvider" value="google" />

              {/* Calendar selector */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="calendarId">Calendar</Label>
                {calendars.length > 0 ? (
                  <Select
                    name="calendarId"
                    defaultValue={
                      currentSettings.calendarId ?? calendars[0]?.id ?? ""
                    }
                  >
                    <SelectTrigger id="calendarId">
                      <SelectValue placeholder="Select a calendar" />
                    </SelectTrigger>
                    <SelectContent>
                      {calendars.map((cal) => (
                        <SelectItem key={cal.id} value={cal.id}>
                          {cal.summary}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  // Fallback text input when calendar list could not be fetched.
                  <div className="flex flex-col gap-1">
                    <input
                      id="calendarId"
                      name="calendarId"
                      type="text"
                      defaultValue={currentSettings.calendarId ?? "primary"}
                      placeholder="primary"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a calendar ID or leave as &quot;primary&quot; to use
                      your default calendar.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Sync toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="calendarSyncEnabled">Auto-sync events</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically add events to Google Calendar when you mark
                    them as Registered, and remove them when Skipped or deleted.
                  </p>
                </div>
                {/* Hidden input to carry the boolean value; updated by the
                    Switch onChange. We use a separate hidden field because
                    checkboxes only submit when checked. */}
                <input
                  type="hidden"
                  name="calendarSyncEnabled"
                  id="calendarSyncEnabledHidden"
                  defaultValue={
                    currentSettings.calendarSyncEnabled ? "true" : "false"
                  }
                />
                <Switch
                  id="calendarSyncEnabled"
                  defaultChecked={currentSettings.calendarSyncEnabled}
                  onCheckedChange={(checked) => {
                    const hidden = document.getElementById(
                      "calendarSyncEnabledHidden",
                    ) as HTMLInputElement | null;
                    if (hidden) hidden.value = checked ? "true" : "false";
                  }}
                />
              </div>

              <Button type="submit" disabled={isPending} className="self-start">
                {isPending ? "Saving…" : "Save settings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
