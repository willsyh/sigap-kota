import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { REPORT_STATUSES } from "@/lib/constants/reports";
import type { ReportStatus } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Cek sesi: harus admin
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON" }, { status: 400 });
  }

  const status = (body as { status?: unknown })?.status;

  if (
    typeof status !== "string" ||
    !REPORT_STATUSES.includes(status as ReportStatus)
  ) {
    return NextResponse.json(
      { error: "Status tidak valid" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Ambil status lama untuk activity log
  const { data: existing, error: fetchError } = await supabase
    .from("reports")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: "Laporan tidak ditemukan" },
      { status: 404 },
    );
  }

  const { data, error: updateError } = await supabase
    .from("reports")
    .update({ status: status as ReportStatus })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: "Gagal memperbarui status" },
      { status: 500 },
    );
  }

  // Catat perubahan status
  const { error: logError } = await supabase.from("status_logs").insert({
    report_id: id,
    old_status: existing.status,
    new_status: status as ReportStatus,
  });

  if (logError) {
    console.error("Gagal mencatat status_logs:", logError.message);
  }

  return NextResponse.json(data);
}
