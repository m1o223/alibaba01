export type AddressSuggestion = { street: string; postalCode: string; city: string };

// Only an explicitly approved same-origin proxy may handle coordinates. No public
// geocoder, API key, provider account, or real delivery endpoint is enabled here.
export function approvedLookupPath(path: unknown): string | null {
  return typeof path === "string" && /^\/api\/[a-zA-Z0-9/_-]+$/.test(path) ? path : null;
}

export async function lookupAddress(path: string, coordinates: { latitude: number; longitude: number }, signal: AbortSignal): Promise<AddressSuggestion> {
  if (!approvedLookupPath(path) || !Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude)
    || Math.abs(coordinates.latitude) > 90 || Math.abs(coordinates.longitude) > 180) throw new Error("Invalid lookup configuration");
  const response = await fetch(path, { method: "POST", credentials: "same-origin", cache: "no-store", signal,
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(coordinates) });
  if (!response.ok) throw new Error("Address lookup unavailable");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object") throw new Error("Invalid address suggestion");
  const value = data as Record<string, unknown>;
  if (typeof value.street !== "string" || value.street.length > 160 || typeof value.postalCode !== "string" || value.postalCode.length > 6
    || typeof value.city !== "string" || value.city.length > 100) throw new Error("Invalid address suggestion");
  return { street: value.street, postalCode: value.postalCode, city: value.city };
}
