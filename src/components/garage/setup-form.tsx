"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import type { SetupActionState } from "@/lib/actions/suspension-setup";
import type { SuspensionSetup } from "@prisma/client";

interface SetupFormProps {
  action: (
    prevState: SetupActionState,
    formData: FormData,
  ) => Promise<SetupActionState>;
  carId: string;
  defaultValues?: Partial<SuspensionSetup>;
}

const initialState: SetupActionState = {};

function NumberInput({
  id,
  name,
  label,
  placeholder,
  defaultValue,
  step = "0.01",
  fieldError,
}: {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: number | null;
  step?: string;
  fieldError?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type="number"
        step={step}
        placeholder={placeholder ?? "—"}
        defaultValue={defaultValue ?? ""}
        aria-invalid={!!fieldError}
        className="h-9"
      />
      {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
    </div>
  );
}

function CornerGrid({
  prefix,
  label,
  unit,
  defaultValues,
  fieldError,
  step = "0.01",
  rearLabels = true,
}: {
  prefix: string;
  label: string;
  unit: string;
  defaultValues?: Partial<SuspensionSetup>;
  fieldError?: (field: string) => string | undefined;
  step?: string;
  rearLabels?: boolean;
}) {
  const fe = fieldError ?? (() => undefined);
  const flKey = `${prefix}FL` as keyof SuspensionSetup;
  const frKey = `${prefix}FR` as keyof SuspensionSetup;
  const rlKey = `${prefix}RL` as keyof SuspensionSetup;
  const rrKey = `${prefix}RR` as keyof SuspensionSetup;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label} <span className="normal-case font-normal">({unit})</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          id={`${prefix}FL`}
          name={`${prefix}FL`}
          label="FL"
          defaultValue={defaultValues?.[flKey] as number | null}
          fieldError={fe(`${prefix}FL`)}
          step={step}
        />
        <NumberInput
          id={`${prefix}FR`}
          name={`${prefix}FR`}
          label="FR"
          defaultValue={defaultValues?.[frKey] as number | null}
          fieldError={fe(`${prefix}FR`)}
          step={step}
        />
        {rearLabels && (
          <>
            <NumberInput
              id={`${prefix}RL`}
              name={`${prefix}RL`}
              label="RL"
              defaultValue={defaultValues?.[rlKey] as number | null}
              fieldError={fe(`${prefix}RL`)}
              step={step}
            />
            <NumberInput
              id={`${prefix}RR`}
              name={`${prefix}RR`}
              label="RR"
              defaultValue={defaultValues?.[rrKey] as number | null}
              fieldError={fe(`${prefix}RR`)}
              step={step}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function SetupForm({ action, carId, defaultValues }: SetupFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.data) {
      toast.success(defaultValues?.id ? "Setup updated" : "Setup created");
      router.push(`/garage/${carId}/setups`);
    }
  }, [state.data]);

  const fieldError = (field: string): string | undefined =>
    state.fieldErrors?.[field]?.[0];

  const isEdit = !!defaultValues?.id;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="carId" value={carId} />
      {isEdit && (
        <input type="hidden" name="setupId" value={defaultValues.id} />
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Setup Name *</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="e.g. Autocross — Soft Springs"
          required
          defaultValue={defaultValues?.name ?? ""}
          aria-invalid={!!fieldError("name")}
        />
        {fieldError("name") && (
          <p className="text-xs text-destructive">{fieldError("name")}</p>
        )}
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <p className="text-sm font-medium">Set as Active</p>
          <p className="text-xs text-muted-foreground">
            Mark this as the current setup for this car
          </p>
        </div>
        <Switch
          name="isActive"
          value="true"
          defaultChecked={defaultValues?.isActive ?? false}
        />
      </div>

      <Separator />
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        Tire Pressures
      </p>

      <CornerGrid
        prefix="tirePressure"
        label="Pressures"
        unit="PSI"
        defaultValues={defaultValues}
        fieldError={fieldError}
      />

      <Separator />
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        Alignment
      </p>

      <div className="space-y-4">
        <CornerGrid
          prefix="camber"
          label="Camber"
          unit="degrees"
          defaultValues={defaultValues}
          fieldError={fieldError}
        />
        <CornerGrid
          prefix="toe"
          label="Toe"
          unit="degrees"
          defaultValues={defaultValues}
          fieldError={fieldError}
        />
      </div>

      <Separator />
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        Ride Height
      </p>

      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          id="rideHeightFront"
          name="rideHeightFront"
          label="Front (mm)"
          defaultValue={defaultValues?.rideHeightFront}
          fieldError={fieldError("rideHeightFront")}
        />
        <NumberInput
          id="rideHeightRear"
          name="rideHeightRear"
          label="Rear (mm)"
          defaultValue={defaultValues?.rideHeightRear}
          fieldError={fieldError("rideHeightRear")}
        />
      </div>

      <Separator />

      {/* Advanced section */}
      <CollapsibleSection title="Advanced Settings">
        <div className="space-y-5">
          {/* Caster (front only) */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Caster{" "}
              <span className="normal-case font-normal">
                (degrees, front only)
              </span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                id="casterFL"
                name="casterFL"
                label="FL"
                defaultValue={defaultValues?.casterFL}
                fieldError={fieldError("casterFL")}
              />
              <NumberInput
                id="casterFR"
                name="casterFR"
                label="FR"
                defaultValue={defaultValues?.casterFR}
                fieldError={fieldError("casterFR")}
              />
            </div>
          </div>

          {/* Spring rates */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Spring Rates{" "}
              <span className="normal-case font-normal">(lbs/in)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                id="springRateFront"
                name="springRateFront"
                label="Front"
                defaultValue={defaultValues?.springRateFront}
                fieldError={fieldError("springRateFront")}
                step="1"
              />
              <NumberInput
                id="springRateRear"
                name="springRateRear"
                label="Rear"
                defaultValue={defaultValues?.springRateRear}
                fieldError={fieldError("springRateRear")}
                step="1"
              />
            </div>
          </div>

          {/* Damper clicks */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Damper Clicks
            </p>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                id="damperClicksFrontComp"
                name="damperClicksFrontComp"
                label="F Compression"
                defaultValue={defaultValues?.damperClicksFrontComp}
                fieldError={fieldError("damperClicksFrontComp")}
                step="1"
              />
              <NumberInput
                id="damperClicksFrontReb"
                name="damperClicksFrontReb"
                label="F Rebound"
                defaultValue={defaultValues?.damperClicksFrontReb}
                fieldError={fieldError("damperClicksFrontReb")}
                step="1"
              />
              <NumberInput
                id="damperClicksRearComp"
                name="damperClicksRearComp"
                label="R Compression"
                defaultValue={defaultValues?.damperClicksRearComp}
                fieldError={fieldError("damperClicksRearComp")}
                step="1"
              />
              <NumberInput
                id="damperClicksRearReb"
                name="damperClicksRearReb"
                label="R Rebound"
                defaultValue={defaultValues?.damperClicksRearReb}
                fieldError={fieldError("damperClicksRearReb")}
                step="1"
              />
            </div>
          </div>

          {/* Sway bars */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sway Bar Settings
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="swayBarFront" className="text-xs">
                  Front
                </Label>
                <Input
                  id="swayBarFront"
                  name="swayBarFront"
                  type="text"
                  placeholder="e.g. Soft / Hole 3"
                  defaultValue={defaultValues?.swayBarFront ?? ""}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="swayBarRear" className="text-xs">
                  Rear
                </Label>
                <Input
                  id="swayBarRear"
                  name="swayBarRear"
                  type="text"
                  placeholder="e.g. Medium"
                  defaultValue={defaultValues?.swayBarRear ?? ""}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <Separator />

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Conditions, goals, observations..."
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Setup"}
      </Button>
    </form>
  );
}
