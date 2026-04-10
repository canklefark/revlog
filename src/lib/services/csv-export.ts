import type {
  Mod,
  WishlistItem,
  MaintenanceEntry,
  Run,
  Event,
  Expense,
} from "@prisma/client";

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCSV(fields: unknown[]): string {
  return fields.map(escapeCSV).join(",");
}

export function modsToCSV(mods: Mod[]): string {
  const header = rowToCSV([
    "Name",
    "Category",
    "Brand",
    "Part Number",
    "Install Date",
    "Installed By",
    "Shop Name",
    "Cost",
    "Odometer at Install",
    "Notes",
  ]);
  const rows = mods.map((m) =>
    rowToCSV([
      m.name,
      m.category,
      m.brand,
      m.partNumber,
      m.installDate
        ? new Date(m.installDate).toISOString().split("T")[0]
        : null,
      m.installedBy,
      m.shopName,
      m.cost,
      m.odometerAtInstall,
      m.notes,
    ]),
  );
  return [header, ...rows].join("\n");
}

export function wishlistToCSV(items: WishlistItem[]): string {
  const header = rowToCSV([
    "Name",
    "Category",
    "Priority",
    "Estimated Cost",
    "Source URL",
    "Notes",
  ]);
  const rows = items.map((i) =>
    rowToCSV([
      i.name,
      i.category,
      i.priority,
      i.estimatedCost,
      i.sourceUrl,
      i.notes,
    ]),
  );
  return [header, ...rows].join("\n");
}

export function maintenanceToCSV(entries: MaintenanceEntry[]): string {
  const header = rowToCSV([
    "Service Type",
    "Custom Name",
    "Date",
    "Odometer",
    "Performed By",
    "Shop Name",
    "Product Brand",
    "Product Spec",
    "Cost",
    "Next Due Date",
    "Next Due Mileage",
    "Notes",
  ]);
  const rows = entries.map((e) =>
    rowToCSV([
      e.serviceType,
      e.customServiceName,
      new Date(e.date).toISOString().split("T")[0],
      e.odometer,
      e.performedBy,
      e.shopName,
      e.productBrand,
      e.productSpec,
      e.cost,
      e.nextDueDate
        ? new Date(e.nextDueDate).toISOString().split("T")[0]
        : null,
      e.nextDueMileage,
      e.notes,
    ]),
  );
  return [header, ...rows].join("\n");
}

type RunWithEvent = Run & {
  event: { name: string; startDate: Date; type: string };
};

export function runsToCSV(runs: RunWithEvent[]): string {
  const header = rowToCSV([
    "Event",
    "Event Type",
    "Event Date",
    "Run #",
    "Raw Time (s)",
    "Adjusted Time (s)",
    "Conditions",
    "Tire Setup",
    "Notes",
  ]);
  const rows = runs.map((r) => {
    const conditions = Array.isArray(r.conditions)
      ? r.conditions.join(";")
      : "";
    return rowToCSV([
      r.event.name,
      r.event.type,
      new Date(r.event.startDate).toISOString().split("T")[0],
      r.runNumber,
      r.rawTime,
      r.adjustedTime ?? "DNF",
      conditions,
      r.tireSetup,
      r.notes,
    ]);
  });
  return [header, ...rows].join("\n");
}

export function eventsToCSV(events: Event[]): string {
  const header = rowToCSV([
    "Name",
    "Type",
    "Start Date",
    "End Date",
    "Status",
    "Venue",
    "Address",
    "Distance (mi)",
    "Drive Time (min)",
    "Entry Fee",
    "Organizing Body",
    "Run Group",
    "Notes",
  ]);
  const rows = events.map((e) =>
    rowToCSV([
      e.name,
      e.type,
      new Date(e.startDate).toISOString().split("T")[0],
      e.endDate ? new Date(e.endDate).toISOString().split("T")[0] : null,
      e.registrationStatus,
      e.venueName,
      e.address,
      e.distanceFromHome,
      e.driveTimeMinutes,
      e.entryFee,
      e.organizingBody,
      e.runGroup,
      e.notes,
    ]),
  );
  return [header, ...rows].join("\n");
}

export function expensesToCSV(expenses: Expense[]): string {
  const header = rowToCSV([
    "Date",
    "Category",
    "Vendor",
    "Description",
    "Amount",
    "Receipt URL",
    "Notes",
  ]);
  const rows = expenses.map((e) =>
    rowToCSV([
      new Date(e.date).toISOString().split("T")[0],
      e.category,
      e.vendor,
      e.description,
      e.amount,
      e.receiptUrl,
      e.notes,
    ]),
  );
  return [header, ...rows].join("\n");
}

export async function generateZipBundle(
  sections: Record<string, string>,
): Promise<Buffer> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const [name, content] of Object.entries(sections)) {
    zip.file(`${name}.csv`, content);
  }
  return zip.generateAsync({ type: "nodebuffer" });
}
