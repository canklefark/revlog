"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatLapTime } from "@/lib/utils/penalty-calc";
import { deleteRun, type RunActionState } from "@/lib/actions/run";
import type { Run } from "@prisma/client";

type RunWithCar = Run & {
  car: {
    id: string;
    year: number;
    make: string;
    model: string;
    nickname: string | null;
  };
};

interface RunListProps {
  runs: RunWithCar[];
  eventId: string;
}

const deleteInitialState: RunActionState = {};

function DeleteRunForm({ runId }: { runId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteRun,
    deleteInitialState,
  );

  useEffect(() => {
    if (state.data) toast.success("Run deleted");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete run?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="runId" value={runId} />
            <AlertDialogAction
              type="submit"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RunList({ runs, eventId }: RunListProps) {
  if (runs.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-sm">No runs logged yet.</p>
      </div>
    );
  }

  const validTimes = runs
    .map((r) => r.adjustedTime)
    .filter((t): t is number => t !== null);
  const bestTime = validTimes.length > 0 ? Math.min(...validTimes) : null;

  return (
    <div className="space-y-2">
      {runs.map((run) => {
        const isDnf = run.adjustedTime === null;
        const isBest =
          run.adjustedTime !== null && run.adjustedTime === bestTime;
        const penalties = (() => {
          try {
            const p = Array.isArray(run.penalties)
              ? run.penalties
              : JSON.parse(run.penalties as string);
            return p as Array<{
              type: string;
              count: number;
              secondsEach: number;
            }>;
          } catch {
            return [];
          }
        })();
        const penaltyCount = penalties.reduce(
          (sum: number, p: { count: number }) => sum + p.count,
          0,
        );

        return (
          <div
            key={run.id}
            className={`flex items-center gap-2 rounded-lg border bg-card p-3 ${
              isBest ? "border-green-500/50" : "border-border"
            }`}
          >
            <div className="w-8 text-center text-xs font-medium text-muted-foreground shrink-0">
              #{run.runNumber}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">
                  {formatLapTime(run.rawTime)}
                </span>
                {penaltyCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    +{penaltyCount} pen.
                  </span>
                )}
                {isDnf ? (
                  <Badge variant="destructive" className="text-xs">
                    DNF
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    -&gt; {formatLapTime(run.adjustedTime as number)}
                  </span>
                )}
                {isBest && (
                  <Badge className="text-xs bg-green-600 hover:bg-green-600">
                    Best
                  </Badge>
                )}
              </div>
              {run.conditions.length > 0 && (
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {run.conditions.map((c) => (
                    <span key={c} className="text-xs text-muted-foreground">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
              >
                <Link href={`/events/${eventId}/runs/${run.id}/edit`}>
                  <PencilIcon className="size-4" />
                </Link>
              </Button>
              <DeleteRunForm runId={run.id} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
