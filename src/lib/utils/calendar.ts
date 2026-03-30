export function buildCalendarDescription(event: {
  organizingBody?: string | null;
  entryFee?: number | null;
  runGroup?: string | null;
  registrationUrl?: string | null;
  notes?: string | null;
}): string {
  const lines: string[] = [];
  if (event.organizingBody)
    lines.push(`Organizing Body: ${event.organizingBody}`);
  if (event.entryFee != null)
    lines.push(`Entry Fee: $${event.entryFee.toFixed(2)}`);
  if (event.runGroup) lines.push(`Run Group/Class: ${event.runGroup}`);
  if (event.registrationUrl)
    lines.push(`Registration URL: ${event.registrationUrl}`);
  if (event.notes) lines.push(`Notes: ${event.notes}`);
  return lines.join("\n");
}
