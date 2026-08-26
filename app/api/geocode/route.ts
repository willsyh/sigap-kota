import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_USER_AGENT = "SigapKota/1.0 (contact@sigapkota.id)";
const REVERSE_CACHE_TTL_MS = 60 * 60 * 1000;
const REVERSE_CACHE_MAX_ENTRIES = 500;

interface ReverseCacheEntry {
  displayName: string | null;
  expiresAt: number;
}

// Cache in-memory sederhana agar Nominatim tidak dihantam request berulang
// untuk koordinat yang sama. Cukup untuk skala aplikasi kompetisi ini.
const reverseCache = new Map<string, ReverseCacheEntry>();

function reverseCacheKey(lat: number, lng: number): string {
  // 4 desimal ~ 11 meter: cukup granular untuk nama jalan/kelurahan.
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function rememberReverse(key: string, entry: ReverseCacheEntry) {
  if (reverseCache.size >= REVERSE_CACHE_MAX_ENTRIES) {
    const oldest = reverseCache.keys().next().value;
    if (oldest !== undefined) reverseCache.delete(oldest);
  }
  reverseCache.set(key, entry);
}

async function handleForwardGeocode(q: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        // Nominatim mensyaratkan User-Agent; tanpa ini request diblokir.
        "User-Agent": NOMINATIM_USER_AGENT,
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

async function handleReverseGeocode(lat: number, lng: number) {
  const key = reverseCacheKey(lat, lng);

  const cached = reverseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.displayName === null) {
      return NextResponse.json(
        { error: "Gagal menghubungi layanan geocoding" },
        { status: 502 },
      );
    }
    return NextResponse.json({ display_name: cached.displayName });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "0");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": NOMINATIM_USER_AGENT,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) throw new Error("upstream_error");

    const data: unknown = await response.json();
    const displayName =
      typeof data === "object" && data !== null && "display_name" in data
        ? (data as { display_name?: unknown }).display_name
        : null;

    if (typeof displayName !== "string" || displayName.length === 0) {
      throw new Error("empty_result");
    }

    rememberReverse(key, {
      displayName,
      expiresAt: Date.now() + REVERSE_CACHE_TTL_MS,
    });

    return NextResponse.json({ display_name: displayName });
  } catch {
    // Cache hasil gagal sebentar agar retry tidak beruntun.
    rememberReverse(key, {
      displayName: null,
      expiresAt: Date.now() + 60_000,
    });
    return NextResponse.json(
      { error: "Gagal menghubungi layanan geocoding" },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest) {
  const latParam = request.nextUrl.searchParams.get("lat");
  const lonParam = request.nextUrl.searchParams.get("lon");

  if (latParam !== null && lonParam !== null) {
    const lat = Number(latParam);
    const lng = Number(lonParam);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return NextResponse.json(
        { error: "Parameter lat/lon tidak valid" },
        { status: 400 },
      );
    }

    return handleReverseGeocode(lat, lng);
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json(
      { error: "Parameter q wajib diisi" },
      { status: 400 },
    );
  }

  return handleForwardGeocode(q);
}
