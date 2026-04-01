"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { cn } from "@/lib/utils";
import {
  EVENT_TYPES,
  REGISTRATION_STATUSES,
} from "@/lib/constants/event-types";
import {
  createEvent,
  updateEvent,
  type EventActionState,
} from "@/lib/actions/event";
import { UrlAutofill } from "@/components/events/url-autofill";
import type { ScrapedEventData } from "@/lib/services/motorsportreg-scraper";
import type { Car, Event } from "@prisma/client";

interface EventFormProps {
  cars: Pick<Car, "id" | "year" | "make" | "model" | "nickname">[];
  event?: Event;
}

type FormValues = {
  name: string;
  type: string;
  organizingBody: string;
  startDate: string;
  endDate: string;
  venueName: string;
  address: string;
  registrationStatus: string;
  registrationDeadline: string;
  entryFee: string;
  registrationUrl: string;
  runGroup: string;
  notes: string;
  carId: string;
};

const initialState: EventActionState = {};

export function EventForm({ cars, event }: EventFormProps) {
  const router = useRouter();
  const isEditing = !!event;

  const [createState, createDispatch, createPending] = useActionState(
    createEvent,
    initialState,
  );
  const [updateState, updateDispatch, updatePending] = useActionState(
    updateEvent,
    initialState,
  );

  const state = isEditing ? updateState : createState;
  const dispatch = isEditing ? updateDispatch : createDispatch;
  const isPending = isEditing ? updatePending : createPending;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    getValues,
  } = useForm<FormValues>({
    defaultValues: {
      name: event?.name ?? "",
      type: event?.type ?? "",
      organizingBody: event?.organizingBody ?? "",
      startDate: event?.startDate
        ? format(new Date(event.startDate), "yyyy-MM-dd")
        : "",
      endDate: event?.endDate
        ? format(new Date(event.endDate), "yyyy-MM-dd")
        : "",
      venueName: event?.venueName ?? "",
      address: event?.address ?? "",
      registrationStatus: event?.registrationStatus ?? "Interested",
      registrationDeadline: event?.registrationDeadline
        ? format(new Date(event.registrationDeadline), "yyyy-MM-dd")
        : "",
      entryFee: event?.entryFee != null ? String(event.entryFee) : "",
      registrationUrl: event?.registrationUrl ?? "",
      runGroup: event?.runGroup ?? "",
      notes: event?.notes ?? "",
      carId: event?.carId ?? "",
    },
  });

  // Client-side validation errors from the server
  const serverErrors = state?.fieldErrors;

  useEffect(() => {
    if (!state) return;
    if (state.error) {
      toast.error(state.error);
    }
    if (state.data && state.data !== true) {
      toast.success(isEditing ? "Event updated." : "Event created.");
      router.push(`/events/${(state.data as Event).id}`);
    }
  }, [state, isEditing, router]);

  function handleAutofill(data: Partial<ScrapedEventData>) {
    if (data.name) setValue("name", data.name);
    if (data.organizingBody) setValue("organizingBody", data.organizingBody);
    if (data.startDate) setValue("startDate", data.startDate);
    if (data.endDate) setValue("endDate", data.endDate);
    if (data.venueName) setValue("venueName", data.venueName);
    if (data.address) setValue("address", data.address);
    if (data.entryFee != null) setValue("entryFee", String(data.entryFee));
    if (data.registrationDeadline)
      setValue("registrationDeadline", data.registrationDeadline);
    if (data.registrationUrl) setValue("registrationUrl", data.registrationUrl);
  }

  function onSubmit() {
    const values = getValues();
    // Validate required fields client-side
    const fd = new FormData();

    if (isEditing && event) {
      fd.append("eventId", event.id);
    }

    const fields = [
      "name",
      "type",
      "organizingBody",
      "startDate",
      "endDate",
      "venueName",
      "address",
      "registrationStatus",
      "registrationDeadline",
      "entryFee",
      "registrationUrl",
      "runGroup",
      "notes",
      "carId",
    ] as const;

    for (const field of fields) {
      const val = values[field];
      if (val && val.trim() !== "" && val !== "none") {
        fd.append(field, val);
      }
    }

    dispatch(fd);
  }

  const nameError = errors.name?.message ?? serverErrors?.name?.[0];
  const typeError = serverErrors?.type?.[0];
  const startDateError = serverErrors?.startDate?.[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      {state?.error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      {!isEditing && (
        <>
          <UrlAutofill onFill={handleAutofill} />
          <Separator />
        </>
      )}

      {/* Required fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Event name *</Label>
          <Input
            id="name"
            placeholder="Region Autocross #3"
            aria-invalid={!!nameError}
            {...register("name", { required: "Event name is required" })}
          />
          {nameError && <p className="text-xs text-destructive">{nameError}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="type">Event type *</Label>
          <Controller
            name="type"
            control={control}
            rules={{ required: "Event type is required" }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="type"
                  className="w-full"
                  aria-invalid={!!(errors.type ?? typeError)}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {(errors.type?.message ?? typeError) && (
            <p className="text-xs text-destructive">
              {errors.type?.message ?? typeError}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Start date *</Label>
          <Controller
            name="startDate"
            control={control}
            rules={{ required: "Start date is required" }}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="Pick a date"
                hasError={!!(errors.startDate ?? startDateError)}
              />
            )}
          />
          {(errors.startDate?.message ?? startDateError) && (
            <p className="text-xs text-destructive">
              {errors.startDate?.message ?? startDateError}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="registrationStatus">Registration status *</Label>
          <Controller
            name="registrationStatus"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="registrationStatus" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {REGISTRATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <Separator />

      <CollapsibleSection title="More Details" defaultOpen={isEditing}>
        <div className="space-y-1.5">
          <Label htmlFor="organizingBody">Organizing body</Label>
          <Input
            id="organizingBody"
            placeholder="SCCA Region Name"
            {...register("organizingBody")}
          />
        </div>

        <div className="space-y-1.5">
          <Label>End date</Label>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="Optional end date"
                hasError={false}
              />
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="venueName">Venue name</Label>
          <Input
            id="venueName"
            placeholder="ORP, Mid-Ohio, etc."
            {...register("venueName")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Street address or city"
            {...register("address")}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Registration deadline</Label>
          <Controller
            name="registrationDeadline"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="Optional deadline"
                hasError={false}
              />
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="entryFee">Entry fee ($)</Label>
          <Input
            id="entryFee"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            {...register("entryFee")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="registrationUrl">Registration URL</Label>
          <Input
            id="registrationUrl"
            type="url"
            placeholder="https://motorsportreg.com/..."
            {...register("registrationUrl")}
          />
          {serverErrors?.registrationUrl?.[0] && (
            <p className="text-xs text-destructive">
              {serverErrors.registrationUrl[0]}
            </p>
          )}
        </div>

        {cars.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="carId">Car</Label>
            <Controller
              name="carId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="carId" className="w-full">
                    <SelectValue placeholder="No car linked" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No car linked</SelectItem>
                    {cars.map((car) => (
                      <SelectItem key={car.id} value={car.id}>
                        {car.nickname
                          ? `${car.nickname} (${car.year} ${car.make} ${car.model})`
                          : `${car.year} ${car.make} ${car.model}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="runGroup">Run group / class</Label>
          <Input
            id="runGroup"
            placeholder="STR, CAM-C, etc."
            {...register("runGroup")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Anything worth remembering..."
            rows={3}
            {...register("notes")}
          />
        </div>
      </CollapsibleSection>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEditing
              ? "Saving…"
              : "Creating…"
            : isEditing
              ? "Save changes"
              : "Create event"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// Internal date picker — uses native input[type=date] for mobile OS picker
interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hasError: boolean;
}

function DatePicker({
  value,
  onChange,
  placeholder,
  hasError,
}: DatePickerProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        !value && "text-muted-foreground",
        hasError && "border-destructive",
      )}
    />
  );
}
