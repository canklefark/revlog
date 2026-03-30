// Server-only — never import this from client components.
// All calls are guarded by GOOGLE_MAPS_API_KEY presence check.

interface DistanceValue {
  value: number; // metres
  text: string;
}

interface DurationValue {
  value: number; // seconds
  text: string;
}

interface DistanceMatrixElement {
  status: string;
  distance: DistanceValue;
  duration: DurationValue;
}

interface DistanceMatrixRow {
  elements: DistanceMatrixElement[];
}

interface DistanceMatrixResponse {
  status: string;
  rows: DistanceMatrixRow[];
}

function isDistanceValue(value: unknown): value is DistanceValue {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.value === "number" && typeof obj.text === "string";
}

function isDistanceMatrixElement(
  value: unknown,
): value is DistanceMatrixElement {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.status === "string" &&
    isDistanceValue(obj.distance) &&
    isDistanceValue(obj.duration)
  );
}

function isDistanceMatrixRow(value: unknown): value is DistanceMatrixRow {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.elements) && obj.elements.every(isDistanceMatrixElement)
  );
}

function isDistanceMatrixResponse(
  data: unknown,
): data is DistanceMatrixResponse {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.status === "string" &&
    Array.isArray(obj.rows) &&
    obj.rows.every(isDistanceMatrixRow)
  );
}

const METRES_PER_MILE = 1609.344;

export async function calculateDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<{ distanceMiles: number; driveTimeMinutes: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const originStr = `${origin.lat},${origin.lng}`;
    const destStr = `${destination.lat},${destination.lng}`;
    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${encodeURIComponent(originStr)}` +
      `&destinations=${encodeURIComponent(destStr)}` +
      `&units=imperial` +
      `&key=${apiKey}`;

    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;

    const data: unknown = await res.json();
    if (!isDistanceMatrixResponse(data)) return null;
    if (data.status !== "OK") return null;

    const row = data.rows[0];
    if (!row) return null;

    const element = row.elements[0];
    if (!element || element.status !== "OK") return null;

    const distanceMiles = element.distance.value / METRES_PER_MILE;
    const driveTimeMinutes = Math.round(element.duration.value / 60);

    return { distanceMiles, driveTimeMinutes };
  } catch {
    return null;
  }
}
