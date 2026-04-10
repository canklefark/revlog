"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { CheckCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  setActiveSetup,
  type SetupActionState,
} from "@/lib/actions/suspension-setup";
import type { SetupDetail } from "@/lib/queries/suspension-setups";

interface SetupDetailProps {
  setup: SetupDetail;
  carId: string;
}

const initialState: SetupActionState = {};

function fmt(value: number | null | undefined, decimals = 2): string {
  if (value == null) return "—";
  return value % 1 === 0 ? String(value) : value.toFixed(decimals);
}

function fmtDeg(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${fmt(value)}\u00B0`;
}

function fmtPsi(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${fmt(value)} PSI`;
}

function SetActiveForm({
  setupId,
  isActive,
}: {
  setupId: string;
  isActive: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    setActiveSetup,
    initialState,
  );

  useEffect(() => {
    if (state.data) toast.success("Active setup updated");
    if (state.error) toast.error(state.error);
  }, [state]);

  if (isActive) return null;

  return (
    <form action={formAction}>
      <input type="hidden" name="setupId" value={setupId} />
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        <CheckCircleIcon className="size-4 mr-1.5" />
        {isPending ? "Activating..." : "Set as Active"}
      </Button>
    </form>
  );
}

/** Alignment corner table — desktop: 4-col table, mobile: per-corner cards */
function AlignmentTable({ setup }: { setup: SetupDetail }) {
  const corners = ["FL", "FR", "RL", "RR"] as const;

  type CornerKey = (typeof corners)[number];

  function camber(c: CornerKey) {
    return fmtDeg(setup[`camber${c}` as keyof SetupDetail] as number | null);
  }
  function toe(c: CornerKey) {
    return fmtDeg(setup[`toe${c}` as keyof SetupDetail] as number | null);
  }
  function caster(c: CornerKey) {
    if (c === "RL" || c === "RR") return "—";
    return fmtDeg(setup[`caster${c}` as keyof SetupDetail] as number | null);
  }

  const rows = [
    { label: "Camber", values: corners.map(camber) },
    { label: "Toe", values: corners.map(toe) },
    { label: "Caster", values: corners.map(caster) },
  ];

  const hasAnyAlignment =
    setup.camberFL != null ||
    setup.camberFR != null ||
    setup.camberRL != null ||
    setup.camberRR != null ||
    setup.toeFL != null ||
    setup.toeFR != null ||
    setup.toeRL != null ||
    setup.toeRR != null ||
    setup.casterFL != null ||
    setup.casterFR != null;

  if (!hasAnyAlignment) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Alignment</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium text-xs w-24">
                  Measurement
                </th>
                {corners.map((c) => (
                  <th
                    key={c}
                    className="text-center py-2 px-3 text-muted-foreground font-medium text-xs"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-2 pr-4 text-xs font-medium text-muted-foreground">
                    {row.label}
                  </td>
                  {row.values.map((val, i) => (
                    <td
                      key={i}
                      className="py-2 px-3 text-center text-sm tabular-nums"
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: per-corner stacked cards */}
        <div className="sm:hidden grid grid-cols-2 gap-3">
          {corners.map((corner, ci) => (
            <div
              key={corner}
              className="rounded-md border border-border p-3 space-y-1.5"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {corner}
              </p>
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between items-center"
                >
                  <span className="text-xs text-muted-foreground">
                    {row.label}
                  </span>
                  <span className="text-xs tabular-nums font-medium">
                    {row.values[ci]}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TirePressuresCard({ setup }: { setup: SetupDetail }) {
  const hasAny =
    setup.tirePressureFL != null ||
    setup.tirePressureFR != null ||
    setup.tirePressureRL != null ||
    setup.tirePressureRR != null;

  if (!hasAny) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Tire Pressures</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["FL", setup.tirePressureFL],
              ["FR", setup.tirePressureFR],
              ["RL", setup.tirePressureRL],
              ["RR", setup.tirePressureRR],
            ] as [string, number | null][]
          ).map(([corner, val]) => (
            <div
              key={corner}
              className="flex justify-between items-center rounded-md bg-muted/40 px-3 py-2"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {corner}
              </span>
              <span className="text-sm tabular-nums font-medium">
                {fmtPsi(val)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SuspensionCard({ setup }: { setup: SetupDetail }) {
  const hasAny =
    setup.springRateFront != null ||
    setup.springRateRear != null ||
    setup.rideHeightFront != null ||
    setup.rideHeightRear != null ||
    setup.damperClicksFrontComp != null ||
    setup.damperClicksFrontReb != null ||
    setup.damperClicksRearComp != null ||
    setup.damperClicksRearReb != null ||
    setup.swayBarFront != null ||
    setup.swayBarRear != null;

  if (!hasAny) return null;

  function row(label: string, front: string, rear: string) {
    if (front === "—" && rear === "—") return null;
    return (
      <div
        key={label}
        className="grid grid-cols-3 items-center py-2 border-b border-border/50 last:border-0"
      >
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm text-center tabular-nums font-medium">
          {front}
        </span>
        <span className="text-sm text-center tabular-nums font-medium">
          {rear}
        </span>
      </div>
    );
  }

  const rows = [
    row(
      "Spring Rate (lbs/in)",
      fmt(setup.springRateFront, 0),
      fmt(setup.springRateRear, 0),
    ),
    row(
      "Ride Height (mm)",
      fmt(setup.rideHeightFront),
      fmt(setup.rideHeightRear),
    ),
    row(
      "Damper Comp (clicks)",
      fmt(setup.damperClicksFrontComp, 0),
      fmt(setup.damperClicksRearComp, 0),
    ),
    row(
      "Damper Reb (clicks)",
      fmt(setup.damperClicksFrontReb, 0),
      fmt(setup.damperClicksRearReb, 0),
    ),
    row("Sway Bar", setup.swayBarFront ?? "—", setup.swayBarRear ?? "—"),
  ].filter(Boolean);

  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Suspension</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 pb-2">
          <span className="text-xs font-medium text-muted-foreground" />
          <span className="text-xs font-medium text-center text-muted-foreground">
            Front
          </span>
          <span className="text-xs font-medium text-center text-muted-foreground">
            Rear
          </span>
        </div>
        {rows}
      </CardContent>
    </Card>
  );
}

function RunHistoryCard({
  setup,
  carId,
}: {
  setup: SetupDetail;
  carId: string;
}) {
  if (setup.runs.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          Run History ({setup.runs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {setup.runs.map((run) => (
            <div
              key={run.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{run.event.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(run.event.startDate).toLocaleDateString()} &middot;{" "}
                  Run #{run.runNumber}
                </p>
              </div>
              <div className="text-right shrink-0">
                {run.isDnf ? (
                  <span className="text-xs text-destructive font-medium">
                    DNF
                  </span>
                ) : (
                  <span className="text-sm tabular-nums font-medium">
                    {run.adjustedTime != null
                      ? `${run.adjustedTime.toFixed(3)}s`
                      : `${run.rawTime.toFixed(3)}s`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SetupDetailView({ setup, carId }: SetupDetailProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold">{setup.name}</h1>
            {setup.isActive && (
              <Badge className="shrink-0 bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/15">
                Active
              </Badge>
            )}
          </div>
        </div>
        <SetActiveForm setupId={setup.id} isActive={setup.isActive} />
      </div>

      {setup.notes && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {setup.notes}
        </p>
      )}

      <Separator />

      {/* Detail sections */}
      <div className="space-y-4">
        <TirePressuresCard setup={setup} />
        <AlignmentTable setup={setup} />
        <SuspensionCard setup={setup} />
        <RunHistoryCard setup={setup} carId={carId} />
      </div>

      {/* Empty state */}
      {setup.tirePressureFL == null &&
        setup.camberFL == null &&
        setup.springRateFront == null && (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">No measurements recorded yet.</p>
            <p className="text-xs mt-1">Edit this setup to add values.</p>
          </div>
        )}
    </div>
  );
}
