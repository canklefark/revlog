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
  notes: z.string().optional(),
  isDnf: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RunFormProps {
  action: (
    prevState: RunActionState,
    formData: FormData,
  ) => Promise<RunActionState>;
  eventId: string;
  carId: string;
  defaultRunNumber?: number;
  defaultValues?: Partial<Run>;
}

const initialState: RunActionState = {};

export function RunForm({
  action,
  eventId,
  carId,
  defaultRunNumber = 1,
  defaultValues,
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

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
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
      toast.success(isEdit ? "Run updated" : "Run added");
      router.push(`/events/${eventId}/runs`);
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
    fd.set("tireSetup", values.tireSetup ?? "");
    fd.set("notes", values.notes ?? "");
    fd.set("isDnf", String(values.isDnf ?? false));
    if (isEdit && defaultValues?.id) fd.set("runId", defaultValues.id);
    startTransition(() => dispatch(fd));
  }

  // Derive live parse state for rawTimeStr feedback
  const rawTimeStr = watchedValues.rawTimeStr ?? "";
  const parsedRawTime = parseLapTime(rawTimeStr);

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

      <div className="space-y-1.5">
        <Label htmlFor="tireSetup">Tire Setup</Label>
        <Input
          id="tireSetup"
          {...register("tireSetup")}
          placeholder="e.g. 245/40R17 Hankook RS4"
        />
      </div>

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
