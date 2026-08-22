import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { REPORT_CATEGORIES } from "@/lib/constants/reports";
import type { Database } from "@/lib/supabase/types";

type ReportCategory = Database["public"]["Enums"]["report_category"];

interface NearbyReportRow {
  id: string;
  title: string;
  vote_count: number | null;
  distance_meters: number;
  status: string;
}

interface DuplicateCandidate {
  id: string;
  title: string;
  vote_count: number | null;
  distance_meters: number;
  status: string;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body harus berupa JSON" },
      { status: 400 },
    );
  }

  const { lat, lng, category } = (body ?? {}) as {
    lat?: unknown;
    lng?: unknown;
    category?: unknown;
  };

  const latitude = Number(lat);
  const longitude = Number(lng);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return NextResponse.json(
      { error: "Koordinat lokasi tidak valid" },
      { status: 400 },
    );
  }

  if (
    typeof category !== "string" ||
    !REPORT_CATEGORIES.includes(category as ReportCategory)
  ) {
    return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
  }

  // Duplicate check tidak boleh memblokir pembuatan laporan:
  // kegagalan RPC tetap dikembalikan sebagai 200 dengan candidates kosong.
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("nearby_reports", {
      p_lat: latitude,
      p_lng: longitude,
      p_category: category as ReportCategory,
      p_radius_meters: 100,
    });

    if (error) {
      return NextResponse.json({ candidates: [], error: "check_failed" });
    }

    const rows = (data ?? []) as NearbyReportRow[];

    const candidates: DuplicateCandidate[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      vote_count: row.vote_count,
      distance_meters: Math.round(row.distance_meters),
      status: row.status,
    }));

    return NextResponse.json({ candidates });
  } catch {
    return NextResponse.json({ candidates: [], error: "check_failed" });
  }
}
