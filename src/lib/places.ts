import type { Mosque, Place } from "./types";

const UAE_TZ = "Asia/Dubai";

/** Launch neighbourhoods. Coordinates are approximate area centres. */
export const AREAS: Place[] = [
  { label: "Dubai Marina", lat: 25.0805, lng: 55.1403 },
  { label: "Jumeirah Lake Towers", lat: 25.0745, lng: 55.145 },
  { label: "Al Barsha", lat: 25.112, lng: 55.198 },
  { label: "Jumeirah", lat: 25.21, lng: 55.255 },
  { label: "Downtown Dubai", lat: 25.1972, lng: 55.2744 },
  { label: "Deira", lat: 25.27, lng: 55.32 },
  { label: "Al Nahda, Dubai", lat: 25.29, lng: 55.37 },
  { label: "Al Majaz, Sharjah", lat: 25.325, lng: 55.385 },
  { label: "Al Khalidiyah, Abu Dhabi", lat: 24.47, lng: 54.35 },
  { label: "Khalifa City, Abu Dhabi", lat: 24.42, lng: 54.575 },
  { label: "Al Ain", lat: 24.2075, lng: 55.7447 },
].map((a) => ({ ...a, timeZone: UAE_TZ, source: "area" as const }));

export const DEFAULT_PLACE = AREAS[0];

/**
 * Sample mosques so the demo works offline. Names are placeholders, not real
 * mosques; real data comes from OpenStreetMap (see osm.ts) and, later, partners.
 */
export const SAMPLE_MOSQUES: Mosque[] = [
  sample("marina-1", "Marina Promenade Masjid", "Dubai Marina", 25.0789, 55.1385, true, "By the main gate, next to the shoe racks"),
  sample("marina-2", "Marina Walk Masjid", "Dubai Marina", 25.0841, 55.1432, false, "At the bottom of the front steps"),
  sample("jlt-1", "Cluster Lakeside Masjid", "Jumeirah Lake Towers", 25.0731, 55.1468, true, "Main entrance, facing the lake"),
  sample("barsha-1", "Barsha Park Masjid", "Al Barsha", 25.1134, 55.2012, true, "Men's entrance on the car park side"),
  sample("jumeirah-1", "Beach Road Masjid", "Jumeirah", 25.2086, 55.2531, true, "Under the arches at the front"),
  sample("downtown-1", "Boulevard Masjid", "Downtown Dubai", 25.1951, 55.2771, true, "Front courtyard, by the fountain"),
  sample("deira-1", "Creekside Masjid", "Deira", 25.2689, 55.3186, true, "Main door on the creek side"),
  sample("nahda-1", "Nahda Gardens Masjid", "Al Nahda, Dubai", 25.2911, 55.3712, true, "By the wudu area entrance"),
  sample("majaz-1", "Majaz Waterfront Masjid", "Al Majaz, Sharjah", 25.3262, 55.3838, true, "Front steps facing the lake"),
  sample("khalidiyah-1", "Corniche Gardens Masjid", "Al Khalidiyah, Abu Dhabi", 24.4712, 54.3519, true, "Main gate on the park side"),
  sample("khalifa-1", "Khalifa City Community Masjid", "Khalifa City, Abu Dhabi", 24.4189, 54.5768, true, "Main entrance, by the palm trees"),
  sample("alain-1", "Oasis Masjid", "Al Ain", 24.2091, 55.7431, true, "By the main gate"),
];

function sample(
  id: string,
  name: string,
  area: string,
  lat: number,
  lng: number,
  sistersSection: boolean,
  meetingPoint: string,
): Mosque {
  return {
    id: `sample-${id}`,
    name,
    area,
    lat,
    lng,
    sistersSection,
    wuduArea: true,
    parking: null,
    meetingPoint,
    source: "sample",
  };
}

/** Great-circle distance in km. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Distances are shown as bands, never exact, so nobody can triangulate where
 * another user lives.
 */
export function distanceBand(km: number): string {
  if (km < 0.5) return "under 500 m";
  if (km < 1) return "about 1 km";
  if (km < 2) return "1–2 km";
  if (km < 5) return "2–5 km";
  if (km < 10) return "5–10 km";
  return "10+ km";
}

export function walkingMinutes(km: number): number {
  return Math.max(1, Math.round((km / 4.5) * 60));
}

export function nearestMosques(place: { lat: number; lng: number }, mosques: Mosque[], limit = 8) {
  return mosques
    .map((m) => ({ mosque: m, km: distanceKm(place, m) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}
