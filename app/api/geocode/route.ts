import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json(
      { error: "Parameter q wajib diisi" },
      { status: 400 },
    );
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        // Nominatim mensyaratkan User-Agent; tanpa ini request diblokir.
        "User-Agent": "SigapKota/1.0 (contact@sigapkota.id)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Gagal menghubungi layanan geocoding" },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Gagal menghubungi layanan geocoding" },
      { status: 502 },
    );
  }
}
