import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ReportStatus } from "@/lib/types";

const ALLOWED_STATUSES: ReportStatus[] = ["dilaporkan", "diproses", "menunggu_konfirmasi", "selesai"];

// Status yang boleh di-set langsung oleh admin (tanpa foto)
const ADMIN_DIRECT_STATUSES: ReportStatus[] = ["dilaporkan", "diproses"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  if (user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("reports")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  // --- Kasus: admin upload foto + set menunggu_konfirmasi (multipart) ---
  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Form data tidak valid" }, { status: 400 });
    }

    const file = formData.get("photo_after");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Foto sesudah wajib disertakan" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `after/${id}-${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("report-photos")
      .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error("PATCH storage upload error:", uploadError.message);
      return NextResponse.json({ error: "Gagal upload foto", detail: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("report-photos").getPublicUrl(path);
    const photoAfterUrl = urlData.publicUrl;

    const { data, error: updateError } = await supabase
      .from("reports")
      .update({ status: "menunggu_konfirmasi", photo_after_url: photoAfterUrl })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("PATCH laporan update error:", updateError.message, updateError.code);
      return NextResponse.json({ error: "Gagal memperbarui laporan", detail: updateError.message }, { status: 500 });
    }

    await supabase.from("status_logs").insert({
      report_id: id,
      old_status: existing.status,
      new_status: "menunggu_konfirmasi",
    });

    return NextResponse.json(data);
  }

  // --- Kasus: update status biasa (JSON) ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON" }, { status: 400 });
  }

  const status = (body as { status?: unknown })?.status;

  if (
    typeof status !== "string" ||
    !ALLOWED_STATUSES.includes(status as ReportStatus)
  ) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  // Admin hanya boleh set status dilaporkan/diproses via JSON;
  // menunggu_konfirmasi via multipart, selesai via endpoint konfirmasi user
  if (!ADMIN_DIRECT_STATUSES.includes(status as ReportStatus)) {
    return NextResponse.json(
      { error: "Gunakan endpoint yang sesuai untuk status ini" },
      { status: 400 },
    );
  }

  const { data, error: updateError } = await supabase
    .from("reports")
    .update({ status: status as ReportStatus })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("PATCH laporan status error:", updateError.message, updateError.code);
    return NextResponse.json({ error: "Gagal memperbarui status", detail: updateError.message }, { status: 500 });
  }

  await supabase.from("status_logs").insert({
    report_id: id,
    old_status: existing.status,
    new_status: status as ReportStatus,
  });

  return NextResponse.json(data);
}

// Hapus laporan: pemilik laporan atau admin. Selalu dicatat di deletion_logs.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  // Alasan penghapusan wajib
  let reason = "";
  try {
    const body = (await request.json()) as { reason?: unknown };
    if (typeof body?.reason === "string") reason = body.reason.trim();
  } catch {
    // body kosong ditolak di validasi bawah
  }

  if (!reason) {
    return NextResponse.json(
      { error: "Alasan penghapusan wajib diisi" },
      { status: 400 },
    );
  }

  const isAdmin = user.user_metadata?.role === "admin";
  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("reports")
    .select("id, user_id, title, category")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  // Hanya pemilik laporan atau admin yang boleh menghapus
  if (existing.user_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: "Hanya pemilik laporan yang dapat menghapus" }, { status: 403 });
  }

  // Catat log penghapusan SEBELUM baris reports dihapus
  const { error: logError } = await supabase.from("deletion_logs").insert({
    report_id: existing.id,
    deleted_by: user.id,
    role: isAdmin ? "admin" : "user",
    title: existing.title,
    category: existing.category,
    reason,
  });

  if (logError) {
    console.error("DELETE deletion_logs error:", logError.message);
    return NextResponse.json(
      { error: "Gagal mencatat log penghapusan", detail: logError.message },
      { status: 500 },
    );
  }

  const { error: deleteError } = await supabase
    .from("reports")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("DELETE laporan error:", deleteError.message);
    return NextResponse.json(
      { error: "Gagal menghapus laporan", detail: deleteError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
