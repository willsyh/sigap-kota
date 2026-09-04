import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  PERCEPTION_REASONS,
  PERCEPTION_SENTIMENTS,
} from "@/lib/constants/perceptions";
import type { PerceptionReason, PerceptionSentiment } from "@/lib/supabase/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_NOTE_LENGTH = 280;
const RATE_LIMIT_PER_HOUR = 20;

export async function POST(request: NextRequest) {
  // Verifikasi sesi user dari cookie
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body harus berupa JSON yang valid" },
      { status: 400 },
    );
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  const sentiment = String(payload.sentiment ?? "");
  const reasonRaw = payload.reason;
  const note = String(payload.note ?? "").trim();
  const reportIdRaw = payload.report_id;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      { error: "Koordinat lokasi tidak valid" },
      { status: 400 },
    );
  }

  if (!PERCEPTION_SENTIMENTS.includes(sentiment as PerceptionSentiment)) {
    return NextResponse.json(
      { error: "Sentimen persepsi tidak valid" },
      { status: 400 },
    );
  }

  let reason: PerceptionReason | null = null;
  if (reasonRaw !== null && reasonRaw !== undefined && reasonRaw !== "") {
    const reasonStr = String(reasonRaw);
    if (!PERCEPTION_REASONS.includes(reasonStr as PerceptionReason)) {
      return NextResponse.json(
        { error: "Alasan persepsi tidak valid" },
        { status: 400 },
      );
    }
    reason = reasonStr as PerceptionReason;
  }

  if (note.length > MAX_NOTE_LENGTH) {
    return NextResponse.json(
      { error: `Catatan maksimal ${MAX_NOTE_LENGTH} karakter` },
      { status: 400 },
    );
  }

  let reportId: string | null = null;
  if (reportIdRaw !== null && reportIdRaw !== undefined && reportIdRaw !== "") {
    const reportIdStr = String(reportIdRaw);
    if (!UUID_REGEX.test(reportIdStr)) {
      return NextResponse.json(
        { error: "ID laporan tidak valid" },
        { status: 400 },
      );
    }
    reportId = reportIdStr;
  }

  // Rate limit ringan: maksimal RATE_LIMIT_PER_HOUR persepsi per jam.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabaseAuth
    .from("perceptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneHourAgo);

  if (!countError && count !== null && count >= RATE_LIMIT_PER_HOUR) {
    return NextResponse.json(
      { error: "Terlalu banyak persepsi dikirim. Coba lagi nanti." },
      { status: 429 },
    );
  }

  const photoUrlRaw = payload.photo_url;
  let photoUrl: string | null = null;
  if (photoUrlRaw !== null && photoUrlRaw !== undefined && photoUrlRaw !== "") {
    const photoUrlStr = String(photoUrlRaw);
    if (photoUrlStr.length > 2048) {
      return NextResponse.json(
        { error: "URL foto terlalu panjang" },
        { status: 400 },
      );
    }
    photoUrl = photoUrlStr;
  }

  const { data, error } = await supabaseAuth
    .from("perceptions")
    .insert({
      user_id: user.id,
      latitude,
      longitude,
      sentiment: sentiment as PerceptionSentiment,
      reason,
      note: note || null,
      photo_url: photoUrl,
      report_id: reportId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan persepsi" },
      { status: 500 },
    );
  }

  // Privasi: jangan pernah ekspos user_id ke klien.
  // (undefined values dihilangkan saat serialisasi JSON.)
  const publicRow = { ...data, user_id: undefined };

  return NextResponse.json(publicRow, { status: 201 });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const daysParam = searchParams.get("days");
  const reportIdParam = searchParams.get("report_id");

  const days = daysParam === "7" ? 7 : 30;
  // Klien anon terikat cookie; visibilitas diatur oleh RLS.
  const supabase = await createClient();

  let query = supabase
    .from("perceptions")
    .select("id, latitude, longitude, sentiment, reason, note, photo_url, report_id, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  query = query.gte("created_at", since.toISOString());

  if (reportIdParam) {
    if (!UUID_REGEX.test(reportIdParam)) {
      return NextResponse.json(
        { error: "ID laporan tidak valid" },
        { status: 400 },
      );
    }
    query = query.eq("report_id", reportIdParam);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Gagal mengambil persepsi" },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
