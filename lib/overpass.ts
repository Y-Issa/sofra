import type { StoreKind } from "./types";

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "sofra-weekly-cooking-planner/1.0 (personal, non-commercial project)";

export interface NearbyStore {
  id: string;
  name: string;
  lat: number;
  lon: number;
  kind: StoreKind;
  distanceMeters: number;
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function shopToKind(shop: string | undefined): StoreKind | null {
  switch (shop) {
    case "supermarket":
      return "supermarket";
    case "grocery":
    case "convenience":
      return "grocery";
    case "greengrocer":
      return "greengrocer";
    default:
      return null;
  }
}

async function fetchOverpass(query: string): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(OVERPASS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (res.ok) return res;
    if (attempt === 1) return res;
  }
  throw new Error("unreachable");
}

export async function findNearbyStores(
  lat: number,
  lon: number,
  radiusMeters = 2500
): Promise<NearbyStore[]> {
  const query = `[out:json][timeout:20];(nwr["shop"~"^(supermarket|grocery|greengrocer|convenience)$"](around:${radiusMeters},${lat},${lon}););out center 80;`;

  const res = await fetchOverpass(query);

  if (!res.ok) {
    throw new Error(`Overpass request failed with status ${res.status}`);
  }

  const data = (await res.json()) as { elements: OverpassElement[] };

  const stores: NearbyStore[] = [];
  for (const el of data.elements) {
    const name = el.tags?.["name:en"] ?? el.tags?.name;
    if (!name) continue;
    const kind = shopToKind(el.tags?.shop);
    if (!kind) continue;
    const elLat = el.lat ?? el.center?.lat;
    const elLon = el.lon ?? el.center?.lon;
    if (elLat == null || elLon == null) continue;
    stores.push({
      id: `${el.type}/${el.id}`,
      name,
      lat: elLat,
      lon: elLon,
      kind,
      distanceMeters: Math.round(haversineMeters(lat, lon, elLat, elLon)),
    });
  }

  stores.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return stores.slice(0, 30);
}
