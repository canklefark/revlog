"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  updateBugReportStatus,
  type AdminBugReportActionState,
} from "@/lib/actions/bug-report";
import {
  BUG_REPORT_CATEGORY_LABELS,
  BUG_REPORT_STATUS_LABELS,
  BUG_REPORT_STATUS_VARIANTS,
  type BugReportCategory,
  type BugReportStatus,
} from "@/lib/constants/bug-report-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface BugReportItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  adminNote: string | null;
  createdAt: Date;
  user: { name: string | null; email: string | null };
}

const initialState: AdminBugReportActionState = {};

function ReportCard({ report }: { report: BugReportItem }) {
  const [state, formAction, isPending] = useActionState(
    updateBugReportStatus,
    initialState,
  );

  useEffect(() => {
    if (state.data) toast.success("Status updated.");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">{report.title}</CardTitle>
            <CardDescription className="text-xs">
              {report.user.name ?? report.user.email ?? "Unknown"} ·{" "}
              {formatDistanceToNow(report.createdAt, { addSuffix: true })}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">
              {BUG_REPORT_CATEGORY_LABELS[
                report.category as BugReportCategory
              ] ?? report.category}
            </Badge>
            <Badge
              variant={
                BUG_REPORT_STATUS_VARIANTS[report.status as BugReportStatus] ??
                "outline"
              }
            >
              {BUG_REPORT_STATUS_LABELS[report.status as BugReportStatus] ??
                report.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {report.description}
        </p>
        <form action={formAction} className="flex flex-col gap-3 border-t pt-3">
          <input type="hidden" name="id" value={report.id} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`status-${report.id}`} className="text-xs">
              Status
            </Label>
            <Select name="status" defaultValue={report.status}>
              <SelectTrigger id={`status-${report.id}`} className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`note-${report.id}`} className="text-xs">
              Admin note (optional)
            </Label>
            <Textarea
              id={`note-${report.id}`}
              name="adminNote"
              defaultValue={report.adminNote ?? ""}
              rows={2}
              maxLength={1000}
              placeholder="Internal note…"
              className="resize-none text-xs"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={isPending}
            className="self-start"
          >
            {isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface Props {
  reports: BugReportItem[];
}

export function BugReportsList({ reports }: Props) {
  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground">No reports yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {reports.map((r) => (
        <ReportCard key={r.id} report={r} />
      ))}
    </div>
  );
}
