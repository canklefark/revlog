"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { FlameIcon, PencilIcon, ClockIcon, WrenchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  incrementBrakeHeatCycles,
  type BrakeSetActionState,
} from "@/lib/actions/brake-set";
import type { BrakeSetDetailResult } from "@/lib/queries/brake-sets";

interface BrakeSetDetailProps {
  result: BrakeSetDetailResult;
  carId: string;
}

const heatInitialState: BrakeSetActionState = {};

function getWearColor(wear: number): string {
  if (wear < 20) return "hsl(var(--destructive))";
  if (wear <= 50) return "#eab308";
  return "#22c55e";
}

function getWearLabel(wear: number): string {
  if (wear < 20) return "Critical";
  if (wear <= 50) return "Moderate";
  return "Good";
}

function positionVariant(
  position: string,
): "default" | "secondary" | "outline" {
  if (position === "Front") return "default";
  if (position === "Rear") return "secondary";
  return "outline";
}

function HeatCycleButton({ brakeSetId }: { brakeSetId: string }) {
  const [state, formAction, isPending] = useActionState(
    incrementBrakeHeatCycles,
    heatInitialState,
  );

  useEffect(() => {
    if (state.data) toast.success("Heat cycle recorded");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="brakeSetId" value={brakeSetId} />
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        <FlameIcon className="size-4 mr-1" />
        {isPending ? "Recording..." : "+1 Heat Cycle"}
      </Button>
    </form>
  );
}

export function BrakeSetDetail({ result, carId }: BrakeSetDetailProps) {
  const { brakeSet, maintenanceHistory } = result;
  const padLabel = [brakeSet.padBrand, brakeSet.padCompound]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={positionVariant(brakeSet.position)}>
              {brakeSet.position}
            </Badge>
            <Badge variant="outline">{brakeSet.status}</Badge>
          </div>
          <h1 className="text-xl font-semibold mt-1">
            {padLabel || "No pad info"}
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FlameIcon className="size-4" />
              {brakeSet.heatCycles} heat cycle
              {brakeSet.heatCycles !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <HeatCycleButton brakeSetId={brakeSet.id} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/garage/${carId}/brakes/${brakeSet.id}/edit`}>
              <PencilIcon className="size-4 mr-1" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Specs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Specs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {brakeSet.rotorBrand && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Rotor Brand</span>
              <span className="font-medium text-right">
                {brakeSet.rotorBrand}
              </span>
            </div>
          )}
          {brakeSet.rotorNotes && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Rotor Notes</span>
              <span className="font-medium text-right">
                {brakeSet.rotorNotes}
              </span>
            </div>
          )}
          {brakeSet.purchaseDate && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Purchased</span>
              <span className="font-medium">
                {new Date(brakeSet.purchaseDate).toLocaleDateString()}
              </span>
            </div>
          )}
          {brakeSet.cost !== null && brakeSet.cost !== undefined && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Cost</span>
              <span className="font-medium">
                $
                {brakeSet.cost.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
          {brakeSet.notes && (
            <div className="pt-2 border-t border-border">
              <p className="text-muted-foreground text-xs mb-1">Notes</p>
              <p className="text-sm">{brakeSet.notes}</p>
            </div>
          )}
          {!brakeSet.rotorBrand &&
            !brakeSet.rotorNotes &&
            !brakeSet.purchaseDate &&
            brakeSet.cost === null &&
            !brakeSet.notes && (
              <p className="text-muted-foreground text-sm">
                No specs recorded.
              </p>
            )}
        </CardContent>
      </Card>

      {/* Wear Status */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Wear Status</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs h-7">
              <Link href={`/garage/${carId}/brakes/${brakeSet.id}/edit`}>
                Update Wear
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {brakeSet.wearRemaining !== null &&
          brakeSet.wearRemaining !== undefined ? (
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <span
                  className="text-4xl font-bold tabular-nums"
                  style={{ color: getWearColor(brakeSet.wearRemaining) }}
                >
                  {brakeSet.wearRemaining}%
                </span>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: getWearColor(brakeSet.wearRemaining),
                    color: getWearColor(brakeSet.wearRemaining),
                  }}
                >
                  {getWearLabel(brakeSet.wearRemaining)}
                </Badge>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${brakeSet.wearRemaining}%`,
                    backgroundColor: getWearColor(brakeSet.wearRemaining),
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Not measured</p>
          )}
        </CardContent>
      </Card>

      {/* Run History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClockIcon className="size-4" />
            Run History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {brakeSet.runs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No runs recorded with this brake set.
            </p>
          ) : (
            <div className="space-y-2">
              {brakeSet.runs.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between gap-2 text-sm py-1.5 border-b border-border last:border-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{run.event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(run.event.startDate).toLocaleDateString()} — Run
                      #{run.runNumber}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    {run.isDnf ? (
                      <Badge variant="destructive" className="text-xs">
                        DNF
                      </Badge>
                    ) : run.adjustedTime !== null &&
                      run.adjustedTime !== undefined ? (
                      <span className="font-mono font-medium">
                        {run.adjustedTime.toFixed(3)}s
                      </span>
                    ) : (
                      <span className="font-mono font-medium">
                        {run.rawTime.toFixed(3)}s
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <WrenchIcon className="size-4" />
            Brake Maintenance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {maintenanceHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No brake maintenance entries found.
            </p>
          ) : (
            <div className="space-y-2">
              {maintenanceHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 text-sm py-1.5 border-b border-border last:border-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{entry.serviceType}</p>
                    {entry.productBrand && (
                      <p className="text-xs text-muted-foreground">
                        {entry.productBrand}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString()}
                    </p>
                    {entry.cost !== null && entry.cost !== undefined && (
                      <p className="text-xs font-medium">
                        $
                        {entry.cost.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
