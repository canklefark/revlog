// Server-only — never import this from client components.
// All calls are guarded by GOOGLE_MAPS_API_KEY presence check.

interface GeocodeLocation {
  lat: number;
  lng: number;
}

interface GeocodeGeometry {
  location: GeocodeLocation;
}

interface GeocodeResult {
  geometry: GeocodeGeometry;
}

interface GeocodeResponse {
  status: string;
  results: GeocodeResult[];
}

function isGeocodeLocation(value: unknown): value is GeocodeLocation {
  return (
    typeof value === "object" &&
    value !== null &&
    "lat" in value &&
    "lng" in value &&
    typeof (value as Record<string, unknown>).lat === "number" &&
    typeof (value as Record<string, unknown>).lng === "number"
  );
}

function isGeocodeResponse(data: unknown): data is GeocodeResponse {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (typeof obj.status !== "string") return false;
  if (!Array.isArray(obj.results)) return false;

  return obj.results.every((result: unknown) => {
    if (typeof result !== "object" || result === null) return false;
    const r = result as Record<string, unknown>;
    if (typeof r.geometry !== "object" || r.geometry === null) return false;
    const geo = r.geometry as Record<string, unknown>;
    return isGeocodeLocation(geo.location);
  });
}

export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;

    const data: unknown = await res.json();
    if (!isGeocodeResponse(data)) return null;
    if (data.status !== "OK" || data.results.length === 0) return null;

    const location = data.results[0].geometry.location;
    return { lat: location.lat, lng: location.lng };
  } catch {
    return null;
  }
}
