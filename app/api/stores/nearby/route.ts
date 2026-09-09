import { NextRequest, NextResponse } from "next/server";
import { findNearbyStores } from "@/lib/overpass";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "Query params lat and lon must be numbers." },
      { status: 400 }
    );
  }

  try {
    const stores = await findNearbyStores(lat, lon);
    return NextResponse.json({ stores });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the map data source. Try again in a moment." },
      { status: 502 }
    );
  }
}
