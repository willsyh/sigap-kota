import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

  // Insert vote — RLS memastikan hanya milik sendiri;
  // unique(report_id, user_id) mencegah vote ganda.
  const { error: insertError } = await supabaseAuth
    .from("votes")
    .insert({ report_id: id, user_id: user.id });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "Sudah vote" },
        { status: 409 },
      );
    }
    console.error("Gagal insert vote:", insertError.message);
    return NextResponse.json(
      { error: "Gagal menyimpan vote" },
      { status: 500 },
    );
  }

  // Increment vote_count secara atomik
  const supabase = createAdminClient();
  const { error: rpcError } = await supabase.rpc("increment_vote", {
    p_report_id: id,
  });

  if (rpcError) {
    console.error("Gagal increment vote_count:", rpcError.message);
    // Kompensasi: hapus vote yang baru saja dibuat agar pengguna
    // dapat mencoba lagi dan vote_count tidak tertinggal.
    // Memakai admin client karena tabel votes tidak punya
    // policy DELETE untuk RLS.
    await supabase
      .from("votes")
      .delete()
      .match({ report_id: id, user_id: user.id });

    return NextResponse.json(
      { error: "Gagal menghitung vote" },
      { status: 500 },
    );
  }

  const { data, error: fetchError } = await supabase
    .from("reports")
    .select("vote_count")
    .eq("id", id)
    .single();

  if (fetchError || !data) {
    return NextResponse.json(
      { error: "Laporan tidak ditemukan" },
      { status: 404 },
    );
  }

  return NextResponse.json({ vote_count: data.vote_count });
}
