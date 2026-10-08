import type { Mosque } from "./types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export function overpassQuery(lat: number, lng: number, radiusM: number): string {
  const sel = `["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lng})`;
  return `[out:json][timeout:10];(node${sel};way${sel};);out center 40;`;
}

export function parseOverpass(elements: OverpassElement[], area: string): Mosque[] {
  const mosques: Mosque[] = [];
  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;
    const tags = el.tags ?? {};
    const name = tags["name:en"] || tags.name || "Unnamed masjid";
    mosques.push({
      id: `osm-${el.type}-${el.id}`,
      name,
      area,
      lat,
      lng,
      sistersSection: tags.female === "yes" ? true : null,
      wuduArea: null,
      parking: null,
      meetingPoint: "Main entrance",
      source: "openstreetmap",
    });
  }
  return mosques;
}

/** Real mosques near a point from OpenStreetMap. Throws on network failure. */
export async function fetchNearbyMosques(lat: number, lng: number, area: string, radiusM = 3000): Promise<Mosque[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      body: new URLSearchParams({ data: overpassQuery(lat, lng, radiusM) }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`OpenStreetMap returned ${res.status}`);
    const json = (await res.json()) as { elements: OverpassElement[] };
    return parseOverpass(json.elements, area);
  } finally {
    clearTimeout(timer);
  }
}
