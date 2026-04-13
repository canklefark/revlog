"use client";

import { useActionState, useEffect, startTransition } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, Trash2Icon, CheckIcon, XIcon } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { PENALTY_TYPES } from "@/lib/constants/penalty-types";
import { RUN_CONDITIONS } from "@/lib/constants/run-conditions";
import {
  calculateAdjustedTime,
  formatLapTime,
  parseLapTime,
} from "@/lib/utils/penalty-calc";
import type { RunActionState } from "@/lib/actions/run";
import type { Run } from "@prisma/client";

const penaltyRowSchema = z.object({
  type: z.string().min(1),
  count: z.number().int().nonnegative(),
  secondsEach: z.number().nonnegative(),
});

const formSchema = z.object({
  rawTimeStr: z.string().min(1, "Raw time is required"),
  penalties: z.array(penaltyRowSchema).optional(),
  conditions: z.array(z.string()).optional(),
  tireSetup: z.string().optional(),
  tireSetId: z.string().optional(),
  brakeSetId: z.string().optional(),
  setupId: z.string().optional(),
  notes: z.string().optional(),
  isDnf: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface TireSetOption {
  id: string;
  brand: string;
  model: string;
  frontSize: string;
  rearSize?: string | null;
}

export interface BrakeSetOption {
  id: string;
  position: string;
  padBrand: string | null;
  padCompound: string | null;
}

export interface SuspensionSetupOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface RunFormProps {
  action: (
    prevState: RunActionState,
    formData: FormData,
  ) => Promise<RunActionState>;
  eventId: string;
  carId: string;
  defaultRunNumber?: number;
  defaultValues?: Partial<Run>;
  sessionLabel?: string;
  tireSets?: TireSetOption[];
  brakeSets?: BrakeSetOption[];
  suspensionSetups?: SuspensionSetupOption[];
  onSuccess?: () => void;
}

const initialState: RunActionState = {};

export function RunForm({
  action,
  eventId,
  carId,
  defaultRunNumber = 1,
  defaultValues,
  sessionLabel,
  tireSets,
  brakeSets,
  suspensionSetups,
  onSuccess,
}: RunFormProps) {
  const router = useRouter();
  const [state, dispatch, isPending] = useActionState(action, initialState);
  const isEdit = !!defaultValues?.id;

  const defaultPenalties = (() => {
    if (!defaultValues?.penalties) return [];
    try {
      const p =
        typeof defaultValues.penalties === "string"
          ? JSON.parse(defaultValues.penalties)
          : defaultValues.penalties;
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  })();

  const defaultIsDnf = defaultValues
    ? defaultValues.adjustedTime === null && defaultValues.rawTime != null
    : false;

  // Determine whether the equipment section should open by default
  const hasEquipmentDefaults = !!(
    defaultValues?.tireSetId ||
    defaultValues?.brakeSetId ||
    defaultValues?.setupId
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rawTimeStr:
        defaultValues?.rawTime != null
          ? formatLapTime(defaultValues.rawTime)
          : "",
      penalties: defaultPenalties,
      conditions: defaultValues?.conditions ?? [],
      tireSetup: defaultValues?.tireSetup ?? "",
      tireSetId: defaultValues?.tireSetId ?? "",
      brakeSetId: defaultValues?.brakeSetId ?? "",
      setupId: defaultValues?.setupId ?? "",
      notes: defaultValues?.notes ?? "",
      isDnf: defaultIsDnf,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "penalties",
  });

  const watchedValues = watch();

  const previewAdjusted = (() => {
    if (watchedValues.isDnf) return null;
    const raw = parseLapTime(watchedValues.rawTimeStr ?? "");
    if (raw === null) return null;
    return calculateAdjustedTime(raw, watchedValues.penalties ?? [], false);
  })();

  useEffect(() => {
    if (state.data) {
      if (state.isPB) {
        toast.success("New Personal Best!");
      } else {
        toast.success(isEdit ? "Run updated" : "Run added");
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/events/${eventId}/runs`);
      }
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  function onSubmit(values: FormValues) {
    const rawTime = parseLapTime(values.rawTimeStr);
    if (rawTime === null) return;
    const fd = new FormData();
    fd.set("eventId", eventId);
    fd.set("carId", carId);
    fd.set("runNumber", String(defaultValues?.runNumber ?? defaultRunNumber));
    fd.set("rawTime", String(rawTime));
    fd.set("penalties", JSON.stringify(values.penalties ?? []));
    fd.set("conditions", (values.conditions ?? []).join(","));
    fd.set("notes", values.notes ?? "");
    fd.set("isDnf", String(values.isDnf ?? false));
    // Equipment FKs — send empty string so server can treat it as undefined
    fd.set("tireSetId", values.tireSetId ?? "");
    fd.set("brakeSetId", values.brakeSetId ?? "");
    fd.set("setupId", values.setupId ?? "");
    if (sessionLabel) fd.set("sessionLabel", sessionLabel);
    if (isEdit && defaultValues?.id) fd.set("runId", defaultValues.id);
    startTransition(() => dispatch(fd));
  }

  // Derive live parse state for rawTimeStr feedback
  const rawTimeStr = watchedValues.rawTimeStr ?? "";
  const parsedRawTime = parseLapTime(rawTimeStr);

  const hasEquipmentOptions =
    (tireSets && tireSets.length > 0) ||
    (brakeSets && brakeSets.length > 0) ||
    (suspensionSetups && suspensionSetups.length > 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Run #{defaultValues?.runNumber ?? defaultRunNumber}
        </span>
        {previewAdjusted !== null ? (
          <span className="text-sm font-semibold">
            {formatLapTime(previewAdjusted)}
          </span>
        ) : watchedValues.isDnf ? (
          <Badge variant="destructive">DNF</Badge>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rawTimeStr">Raw Time (m:ss.xxx) *</Label>
        <Input
          id="rawTimeStr"
          {...register("rawTimeStr")}
          placeholder="1:03.456"
          aria-invalid={!!errors.rawTimeStr}
        />
        {errors.rawTimeStr && (
          <p className="text-xs text-destructive">
            {errors.rawTimeStr.message}
          </p>
        )}
        {rawTimeStr.length > 0 && parsedRawTime !== null ? (
          <p className="text-xs text-green-500 flex items-center gap-1">
            <CheckIcon className="size-3" aria-hidden="true" />
            {formatLapTime(parsedRawTime)}
          </p>
        ) : rawTimeStr.length > 0 && parsedRawTime === null ? (
          <p className="text-xs text-destructive flex items-center gap-1">
            <XIcon className="size-3" aria-hidden="true" />
            Invalid format — use m:ss.xxx or ss.xxx
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Controller
          name="isDnf"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="isDnf"
              checked={field.value ?? false}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="isDnf" className="cursor-pointer">
          Did Not Finish (DNF)
        </Label>
      </div>

      {!watchedValues.isDnf && (
        <>
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Penalties
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ type: "Cone", count: 1, secondsEach: 2 })
                }
              >
                <PlusIcon className="size-3.5" />
                Add
              </Button>
            </div>
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-border bg-muted/30 p-3 space-y-3"
                >
                  {/* Row 1: type select full width */}
                  <Controller
                    name={`penalties.${idx}.type`}
                    control={control}
                    render={({ field: f }) => (
                      <Select value={f.value} onValueChange={f.onChange}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PENALTY_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {/* Row 2: count stepper + seconds + delete */}
                  <div className="flex items-center gap-3">
                    {/* Count stepper */}
                    <div className="flex items-center gap-2">
                      <Controller
                        name={`penalties.${idx}.count`}
                        control={control}
                        render={({ field: f }) => (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 shrink-0"
                              onClick={() =>
                                f.onChange(Math.max(0, (f.value ?? 0) - 1))
                              }
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {f.value ?? 0}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 shrink-0"
                              onClick={() => f.onChange((f.value ?? 0) + 1)}
                            >
                              +
                            </Button>
                          </>
                        )}
                      />
                    </div>

                    <span className="text-xs text-muted-foreground">x</span>

                    {/* Seconds input */}
                    <div className="flex items-center gap-1.5 flex-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        className="h-10"
                        {...register(`penalties.${idx}.secondsEach`, {
                          valueAsNumber: true,
                        })}
                        placeholder="2"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">
                        s
                      </span>
                    </div>

                    {/* Delete */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(idx)}
                      className="h-10 w-10 text-muted-foreground hover:text-destructive ml-auto shrink-0"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        Optional Details
      </p>

      <div className="space-y-1.5">
        <Label>Conditions</Label>
        <div className="flex flex-wrap gap-2">
          <Controller
            name="conditions"
            control={control}
            render={({ field }) => (
              <>
                {RUN_CONDITIONS.map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => {
                      const current = field.value ?? [];
                      const next = current.includes(cond)
                        ? current.filter((c: string) => c !== cond)
                        : [...current, cond];
                      field.onChange(next);
                    }}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      (field.value ?? []).includes(cond)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </>
            )}
          />
        </div>
      </div>

      {hasEquipmentOptions && (
        <CollapsibleSection
          title="Equipment (optional)"
          defaultOpen={hasEquipmentDefaults}
        >
          {tireSets && tireSets.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="tireSetId">Tire Set</Label>
              <Controller
                name="tireSetId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="tireSetId" className="w-full">
                      <SelectValue placeholder="No tire set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {tireSets.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.brand} {t.model} –{" "}
                          {t.rearSize
                            ? `F:${t.frontSize} R:${t.rearSize}`
                            : t.frontSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {defaultValues?.tireSetup && !defaultValues.tireSetId && (
                <p className="text-sm text-muted-foreground">
                  Legacy: {defaultValues.tireSetup}
                </p>
              )}
            </div>
          )}

          {brakeSets && brakeSets.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="brakeSetId">Brake Set</Label>
              <Controller
                name="brakeSetId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="brakeSetId" className="w-full">
                      <SelectValue placeholder="No brake set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {brakeSets.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.position}
                          {b.padBrand ? ` – ${b.padBrand}` : ""}
                          {b.padCompound ? ` ${b.padCompound}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {suspensionSetups && suspensionSetups.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="setupId">Suspension Setup</Label>
              <Controller
                name="setupId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="setupId" className="w-full">
                      <SelectValue placeholder="No setup" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {suspensionSetups.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                          {s.isActive ? " (active)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
        </CollapsibleSection>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Any notes about this run..."
          rows={2}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Run"}
      </Button>
    </form>
  );
}
