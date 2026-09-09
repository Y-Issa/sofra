import { NextRequest, NextResponse } from "next/server";

const USER_AGENT = "sofra-weekly-cooking-planner/1.0 (personal, non-commercial project)";

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
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2`,
      { headers: { "User-Agent": USER_AGENT } }
    );
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    return NextResponse.json({
      address: data.display_name as string | undefined,
      countryCode: (data.address?.country_code as string | undefined)?.toUpperCase(),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the geocoding service." },
      { status: 502 }
    );
  }
}
