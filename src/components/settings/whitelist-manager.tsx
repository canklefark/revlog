"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  addWhitelistEmail,
  removeWhitelistEmail,
  type WhitelistActionState,
} from "@/lib/actions/whitelist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { X } from "lucide-react";

interface WhitelistEntry {
  id: string;
  email: string;
  note: string | null;
  createdAt: Date;
}

interface Props {
  entries: WhitelistEntry[];
}

const initialState: WhitelistActionState = {};

function RemoveButton({ id }: { id: string }) {
  const [state, formAction, isPending] = useActionState(
    removeWhitelistEmail,
    initialState,
  );

  useEffect(() => {
    if (state.data) toast.success("Email removed from whitelist.");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        disabled={isPending}
        aria-label="Remove"
      >
        <X className="h-4 w-4" />
      </Button>
    </form>
  );
}

export function WhitelistManager({ entries }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [addState, addAction, isAdding] = useActionState(
    addWhitelistEmail,
    initialState,
  );

  useEffect(() => {
    if (addState.data) {
      toast.success("Email added to whitelist.");
      formRef.current?.reset();
    }
    if (addState.error) toast.error(addState.error);
  }, [addState]);

  return (
    <div className="flex flex-col gap-4">
      {/* Add form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Email</CardTitle>
          <CardDescription>
            Whitelist an email address to allow registration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            action={addAction}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="friend@example.com"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                name="note"
                type="text"
                placeholder="Who is this for?"
                maxLength={200}
              />
            </div>
            <Button type="submit" className="self-start" disabled={isAdding}>
              {isAdding ? "Adding…" : "Add to whitelist"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Whitelisted Emails</CardTitle>
          <CardDescription>
            {entries.length === 0
              ? "No emails whitelisted. Registration is fully closed."
              : `${entries.length} email${entries.length !== 1 ? "s" : ""} can register.`}
          </CardDescription>
        </CardHeader>
        {entries.length > 0 && (
          <CardContent>
            <ul className="flex flex-col divide-y divide-border">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{entry.email}</span>
                    {entry.note && (
                      <span className="text-xs text-muted-foreground">
                        {entry.note}
                      </span>
                    )}
                  </div>
                  <RemoveButton id={entry.id} />
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
