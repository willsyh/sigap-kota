import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Pulihkan laporan yang soft-deleted. Admin only.
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

  const isAdmin =
    user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin";

  if (!isAdmin) {
    return NextResponse.json({ error: "Hanya admin yang dapat memulihkan laporan" }, { status: 403 });
  }

  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("reports")
    .select("id, deleted_at, status")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  if (!existing.deleted_at) {
    return NextResponse.json({ error: "Laporan tidak sedang terhapus" }, { status: 409 });
  }

  const { data, error: updateError } = await supabase
    .from("reports")
    .update({ deleted_at: null })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("RESTORE laporan error:", updateError.message);
    return NextResponse.json(
      { error: "Gagal memulihkan laporan", detail: updateError.message },
      { status: 500 },
    );
  }

  // Catat pemulihan di Log Aktivitas laporan.
  // Detail page menampilkan string mentah bila label tidak dikenal,
  // sehingga entri ini tampil apa adanya sebagai catatan pemulihan.
  const adminName = user.user_metadata?.full_name || user.email || "Admin";
  await supabase.from("status_logs").insert({
    report_id: id,
    old_status: existing.status,
    new_status: `Dipulihkan oleh ${adminName}`,
  });

  return NextResponse.json(data);
}
