"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Bug } from "lucide-react";
import {
  submitBugReport,
  type BugReportActionState,
} from "@/lib/actions/bug-report";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: BugReportActionState = {};

export function BugReportFab() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    submitBugReport,
    initialState,
  );

  useEffect(() => {
    if (state.data) {
      toast.success("Report submitted — thanks!");
      setOpen(false);
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-md transition-colors hover:bg-accent hover:text-foreground md:bottom-6 md:right-6"
          aria-label="Report a bug or send feedback"
        >
          <Bug className="h-5 w-5" aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fb-category">Type</Label>
            <Select name="category" defaultValue="bug">
              <SelectTrigger id="fb-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug report</SelectItem>
                <SelectItem value="feature">Feature request</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fb-title">Title</Label>
            <Input
              id="fb-title"
              name="title"
              placeholder="Short summary"
              maxLength={200}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fb-description">Description</Label>
            <Textarea
              id="fb-description"
              name="description"
              placeholder="What happened? What did you expect?"
              rows={4}
              maxLength={5000}
              required
              className="resize-none"
            />
          </div>
          <Button type="submit" disabled={isPending} className="self-end">
            {isPending ? "Submitting…" : "Submit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
