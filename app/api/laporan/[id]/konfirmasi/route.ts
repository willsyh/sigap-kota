import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// User pemilik laporan konfirmasi bahwa laporan memang sudah selesai
export async function POST(
  _request: NextRequest,
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

  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("reports")
    .select("status, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  // Hanya pemilik laporan yang boleh konfirmasi
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Hanya pemilik laporan yang dapat mengkonfirmasi" }, { status: 403 });
  }

  if (existing.status !== "menunggu_konfirmasi") {
    return NextResponse.json({ error: "Laporan tidak dalam status menunggu konfirmasi" }, { status: 409 });
  }

  const { data, error: updateError } = await supabase
    .from("reports")
    .update({ status: "selesai" })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Gagal mengkonfirmasi laporan" }, { status: 500 });
  }

  await supabase.from("status_logs").insert({
    report_id: id,
    old_status: "menunggu_konfirmasi",
    new_status: "selesai",
  });

  return NextResponse.json(data);
}
