"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { useEffect } from "react";
import { updateProfile, type UpdateProfileState } from "@/lib/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_TYPES } from "@/lib/constants/event-types";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Sydney",
  "Australia/Sydney",
] as const;

interface ProfileFormProps {
  user: {
    name: string | null;
    email: string | null;
    homeAddress: string | null;
    timezone: string;
    units: string;
    seasonBudget: number | null;
    defaultEventType: string | null;
  } | null;
}

const initialState: UpdateProfileState = {};

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState,
  );

  useEffect(() => {
    if (state.data) {
      toast.success("Profile updated successfully.");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">
          Name{" "}
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={user?.name ?? ""}
          placeholder="Your name"
          aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
        />
        {state.fieldErrors?.name && (
          <p id="name-error" className="text-sm text-destructive">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="homeAddress">Home Address</Label>
        <Input
          id="homeAddress"
          name="homeAddress"
          type="text"
          defaultValue={user?.homeAddress ?? ""}
          placeholder="123 Main St, City, State"
        />
        <p className="text-xs text-muted-foreground">
          Used to calculate drive time to events. Address is stored as-is.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select
          name="timezone"
          defaultValue={user?.timezone ?? "America/New_York"}
        >
          <SelectTrigger id="timezone">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="units">Units</Label>
        <Select name="units" defaultValue={user?.units ?? "imperial"}>
          <SelectTrigger id="units">
            <SelectValue placeholder="Select units" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="imperial">Imperial (miles)</SelectItem>
            <SelectItem value="metric">Metric (kilometers)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="seasonBudget">Season Budget</Label>
        <Input
          id="seasonBudget"
          name="seasonBudget"
          type="number"
          min="0"
          step="0.01"
          defaultValue={user?.seasonBudget ?? ""}
          placeholder="Optional budget for the season"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="defaultEventType">Default Event Type</Label>
        <Select
          name="defaultEventType"
          defaultValue={user?.defaultEventType ?? ""}
        >
          <SelectTrigger id="defaultEventType">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Pre-selected when creating a new event.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
