import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { REPORT_CATEGORIES, REPORT_STATUSES } from "@/lib/constants/reports";
import type { Database } from "@/lib/supabase/types";

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

type ReportCategory = Database["public"]["Enums"]["report_category"];
type ReportStatus = Database["public"]["Enums"]["report_status"];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const kategori = searchParams.get("kategori");
  const status = searchParams.get("status");

  const supabase = createAdminClient();

  let query = supabase.from("reports").select("*").order("created_at", {
    ascending: false,
  });

  if (
    kategori &&
    REPORT_CATEGORIES.includes(kategori as ReportCategory)
  ) {
    query = query.eq("category", kategori as ReportCategory);
  }

  if (status && REPORT_STATUSES.includes(status as ReportStatus)) {
    query = query.eq("status", status as ReportStatus);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Gagal mengambil laporan" },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  // Verifikasi sesi user dari cookie
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Body harus berupa multipart/form-data" },
      { status: 400 },
    );
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const photo = formData.get("photo");

  if (!title) {
    return NextResponse.json({ error: "Judul wajib diisi" }, { status: 400 });
  }

  if (!REPORT_CATEGORIES.includes(category as ReportCategory)) {
    return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
  }

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

  if (photo && !(photo instanceof File)) {
    return NextResponse.json({ error: "Foto tidak valid" }, { status: 400 });
  }

  let photoUrl: string | null = null;
  const supabase = createAdminClient();

  if (photo instanceof File && photo.size > 0) {
    if (!ALLOWED_PHOTO_TYPES.includes(photo.type)) {
      return NextResponse.json(
        { error: "Format foto harus JPEG, PNG, atau WebP" },
        { status: 400 },
      );
    }

    if (photo.size > MAX_PHOTO_SIZE) {
      return NextResponse.json(
        { error: "Ukuran foto maksimal 5MB" },
        { status: 400 },
      );
    }

    const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${randomUUID()}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("report-photos")
      .upload(filePath, photo, {
        contentType: photo.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Gagal mengunggah foto" },
        { status: 500 },
      );
    }

    const { data: urlData } = supabase.storage
      .from("report-photos")
      .getPublicUrl(filePath);

    photoUrl = urlData.publicUrl;
  }

  const { data, error: insertError } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      category: category as ReportCategory,
      latitude,
      longitude,
      photo_url: photoUrl,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Gagal menyimpan laporan" },
      { status: 500 },
    );
  }

  return NextResponse.json(data, { status: 201 });
}
