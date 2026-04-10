"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  FlameIcon,
  PlusIcon,
  Trash2Icon,
  WrenchIcon,
  FlagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteTreadDepthLog,
  incrementHeatCycles,
  type TireSetActionState,
} from "@/lib/actions/tire-set";
import { TreadDepthForm } from "@/components/garage/tread-depth-form";
import type { TireSetDetail } from "@/lib/queries/tire-sets";

interface TireSetDetailProps extends TireSetDetail {
  carId: string;
}

const actionInitialState: TireSetActionState = {};

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "Active") return "default";
  if (status === "Stored") return "secondary";
  return "outline";
}

function HeatCycleButton({ tireSetId }: { tireSetId: string }) {
  const [state, formAction, isPending] = useActionState(
    incrementHeatCycles,
    actionInitialState,
  );

  useEffect(() => {
    if (state.data) toast.success("Heat cycle added");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="tireSetId" value={tireSetId} />
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        <FlameIcon className="size-4 mr-1.5" />
        {isPending ? "Saving..." : "+1 Heat Cycle"}
      </Button>
    </form>
  );
}

function DeleteTreadLogButton({ logId }: { logId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteTreadDepthLog,
    actionInitialState,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (state.data) {
      toast.success("Reading deleted");
      setConfirmOpen(false);
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
        aria-label="Delete reading"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2Icon className="size-3.5" />
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete tread reading?</DialogTitle>
            <DialogDescription>
              This will permanently remove this tread depth measurement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <form action={formAction}>
              <input type="hidden" name="logId" value={logId} />
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "Deleting..." : "Delete"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TireSetDetail({
  tireSet,
  maintenanceHistory,
  carId,
}: TireSetDetailProps) {
  const [showTreadForm, setShowTreadForm] = useState(false);

  const chartData = [...tireSet.treadDepthLogs].reverse().map((log) => ({
    date: new Date(log.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    depth: log.depth,
    position: log.position ?? "All",
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {tireSet.brand} {tireSet.model}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{tireSet.size}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant={statusVariant(tireSet.status)}>
              {tireSet.status}
            </Badge>
            {tireSet.compound && (
              <Badge variant="outline">{tireSet.compound}</Badge>
            )}
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <FlameIcon className="size-4" />
              {tireSet.heatCycles} heat cycle
              {tireSet.heatCycles !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <HeatCycleButton tireSetId={tireSet.id} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/garage/${carId}/tires/${tireSet.id}/edit`}>Edit</Link>
          </Button>
        </div>
      </div>

      {/* Specs Card */}
      {(tireSet.compound || tireSet.purchaseDate || tireSet.cost != null) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Specs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {tireSet.compound && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Compound</span>
                <span>{tireSet.compound}</span>
              </div>
            )}
            {tireSet.purchaseDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchased</span>
                <span>
                  {new Date(tireSet.purchaseDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {tireSet.cost != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost</span>
                <span>
                  $
                  {tireSet.cost.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
            {tireSet.notes && (
              <>
                <Separator />
                <p className="text-muted-foreground text-xs">{tireSet.notes}</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tread Depth Section */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Tread Depth</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTreadForm((v) => !v)}
              className="h-8 text-xs gap-1"
            >
              <PlusIcon className="size-3.5" />
              Add Reading
              {showTreadForm ? (
                <ChevronUpIcon className="size-3.5" />
              ) : (
                <ChevronDownIcon className="size-3.5" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showTreadForm && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <TreadDepthForm
                tireSetId={tireSet.id}
                onSuccess={() => setShowTreadForm(false)}
              />
            </div>
          )}

          {chartData.length > 1 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    label={{
                      value: "32nds",
                      angle: -90,
                      position: "insideLeft",
                      offset: 16,
                      style: { fontSize: 10 },
                    }}
                  />
                  <Tooltip
                    formatter={(value: unknown) =>
                      typeof value === "number"
                        ? [`${value}/32"`, "Depth"]
                        : [String(value), "Depth"]
                    }
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="depth"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    className="stroke-primary"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {tireSet.treadDepthLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tread depth readings yet.
            </p>
          ) : (
            <div className="space-y-1">
              {tireSet.treadDepthLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {log.depth}/32&quot;
                      </span>
                      {log.position && (
                        <Badge variant="outline" className="text-xs">
                          {log.position}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(log.date).toLocaleDateString()}
                      {log.notes && ` — ${log.notes}`}
                    </p>
                  </div>
                  <DeleteTreadLogButton logId={log.id} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Run History */}
      {tireSet.runs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <FlagIcon className="size-4" />
              Run History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tireSet.runs.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between gap-2 text-sm py-1.5 border-b border-border last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{run.event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(run.event.startDate).toLocaleDateString()}{" "}
                      &middot; Run #{run.runNumber}
                    </p>
                  </div>
                  {run.adjustedTime != null && (
                    <span className="shrink-0 font-mono text-sm">
                      {run.adjustedTime.toFixed(3)}s
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance History */}
      {maintenanceHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <WrenchIcon className="size-4" />
              Tire Maintenance History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {maintenanceHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 text-sm py-1.5 border-b border-border last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{entry.serviceType}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString()}
                      {entry.odometer != null &&
                        ` — ${entry.odometer.toLocaleString()} mi`}
                    </p>
                  </div>
                  {entry.cost != null && (
                    <span className="shrink-0 text-sm">
                      $
                      {entry.cost.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
